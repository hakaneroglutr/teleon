// android/app/src/main/java/com/teleon/epg/EPGReminderModule.kt
package com.teleon.epg

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.*
import com.teleon.MainActivity
import java.util.concurrent.TimeUnit

/**
 * EPG program hatırlatıcısı.
 * AlarmManager + BroadcastReceiver ile program başlamadan 5 dakika önce bildirim gönderir.
 */
class EPGReminderModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "TeleonEPGReminderModule"

    companion object {
        const val CHANNEL_ID    = "teleon_epg"
        const val ACTION_REMIND = "com.teleon.EPG_REMIND"
        const val EXTRA_TITLE   = "program_title"
        const val EXTRA_CHANNEL = "channel_name"
        const val EXTRA_START   = "start_time"
    }

    init {
        createNotificationChannel()
    }

    /**
     * Program başlamadan önce hatırlatıcı kur.
     * startTimeMs: Unix timestamp (ms)
     * leadMinutes: kaç dakika önce bildirim gönderilsin (varsayılan 5)
     */
    @ReactMethod
    fun setReminder(
        programTitle:  String,
        channelName:   String,
        startTimeMs:   Double,
        leadMinutes:   Int,
        promise:       Promise
    ) {
        try {
            val triggerAt = startTimeMs.toLong() - TimeUnit.MINUTES.toMillis(leadMinutes.toLong())
            if (triggerAt <= System.currentTimeMillis()) {
                promise.reject("PAST_TIME", "Program zaten başladı veya çok yakın")
                return
            }

            val intent = Intent(reactContext, EPGReminderReceiver::class.java).apply {
                action = ACTION_REMIND
                putExtra(EXTRA_TITLE,   programTitle)
                putExtra(EXTRA_CHANNEL, channelName)
                putExtra(EXTRA_START,   startTimeMs.toLong())
            }

            val requestCode = (programTitle + channelName).hashCode()
            val pending = PendingIntent.getBroadcast(
                reactContext, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val alarm = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            } else {
                alarm.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            }

            promise.resolve(requestCode)
        } catch (e: Exception) {
            promise.reject("REMINDER_ERROR", e.message)
        }
    }

    /** Hatırlatıcıyı iptal et */
    @ReactMethod
    fun cancelReminder(requestCode: Int, promise: Promise) {
        try {
            val intent  = Intent(reactContext, EPGReminderReceiver::class.java)
            val pending = PendingIntent.getBroadcast(
                reactContext, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            (reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(pending)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Teleon EPG Hatırlatıcıları",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Program başlamadan önce gönderilen bildirimler"
                enableVibration(true)
            }
            (reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }
}

// ── Broadcast Receiver ────────────────────────────────────────────────────────
class EPGReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != EPGReminderModule.ACTION_REMIND) return

        val programTitle = intent.getStringExtra(EPGReminderModule.EXTRA_TITLE) ?: return
        val channelName  = intent.getStringExtra(EPGReminderModule.EXTRA_CHANNEL) ?: "Kanal"

        val openIntent  = PendingIntent.getActivity(
            context, 0,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("epg_reminder", true)
                putExtra(EPGReminderModule.EXTRA_CHANNEL, channelName)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, EPGReminderModule.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("⏰ Program Başlıyor")
            .setContentText("$channelName: $programTitle")
            .setStyle(NotificationCompat.BigTextStyle().bigText("$channelName kanalında \"$programTitle\" başlamak üzere!"))
            .setAutoCancel(true)
            .setContentIntent(openIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(programTitle.hashCode(), notification)
    }
}
