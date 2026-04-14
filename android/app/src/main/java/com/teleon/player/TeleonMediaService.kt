// android/app/src/main/java/com/teleon/player/TeleonMediaService.kt
package com.teleon.player

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.teleon.MainActivity

/**
 * Arkaplan oynatma servisi.
 * Android 8.0+ Foreground Service + MediaSession ile bildirim kontrolü.
 * PlayerScreen, PiP moduna geçtiğinde bu servis devreye girer.
 */
class TeleonMediaService : Service() {

    companion object {
        const val CHANNEL_ID    = "teleon_player"
        const val NOTIF_ID      = 1001
        const val ACTION_PLAY   = "com.teleon.PLAY"
        const val ACTION_PAUSE  = "com.teleon.PAUSE"
        const val ACTION_STOP   = "com.teleon.STOP"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PLAY  -> { /* VLC/Exo resume */ }
            ACTION_PAUSE -> { /* VLC/Exo pause  */ }
            ACTION_STOP  -> { stopSelf() }
        }

        startForeground(NOTIF_ID, buildNotification("Oynatılıyor", ""))
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
    }

    // ── Notification ──────────────────────────────────────────────────────────
    private fun buildNotification(title: String, subtitle: String): Notification {
        val openApp = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val pauseIntent = PendingIntent.getService(
            this, 1,
            Intent(this, TeleonMediaService::class.java).apply { action = ACTION_PAUSE },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = PendingIntent.getService(
            this, 2,
            Intent(this, TeleonMediaService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(openApp)
            .addAction(android.R.drawable.ic_media_pause, "Duraklat", pauseIntent)
            .addAction(android.R.drawable.ic_delete,       "Durdur",   stopIntent)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSilent(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Teleon Oynatıcı",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "IPTV arkaplan oynatma bildirimi"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }
}
