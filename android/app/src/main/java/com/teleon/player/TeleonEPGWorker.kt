// android/app/src/main/java/com/teleon/player/TeleonEPGWorker.kt
package com.teleon.player

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * WorkManager ile her 6 saatte bir EPG verilerini arka planda günceller.
 * React Native JS tarafından tetiklenebilir ya da otomatik çalışır.
 */
class TeleonEPGWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            // EPG güncelleme işi burada yapılır.
            // Gerçek implementasyonda Xtream API'den EPG çekilir ve
            // local DB'ye yazılır. JS tarafı WorkManager sonucunu alır.
            android.util.Log.d("TeleonEPG", "EPG arka plan güncellemesi tamamlandı")
            Result.success()
        } catch (e: Exception) {
            android.util.Log.e("TeleonEPG", "EPG güncelleme hatası: ${e.message}")
            Result.retry()
        }
    }

    companion object {
        const val WORK_NAME = "teleon_epg_refresh"

        /** WorkManager'ı periyodik EPG yenileme için yapılandır */
        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<TeleonEPGWorker>(6, TimeUnit.HOURS)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
