// android/app/src/main/java/com/teleon/pip/PiPManager.kt
package com.teleon.pip

import android.app.Activity
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.Intent
import android.graphics.drawable.Icon
import android.os.Build
import android.util.Rational
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * React Native modülü — PiP kontrol.
 * MainActivity.enterPiPMode() ile koordineli çalışır.
 */
class PiPModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "TeleonPiPModule"

    /**
     * Uygulamayı PiP moduna geçir.
     * aspectRatio: "16:9" | "4:3" | "1:1"
     */
    @ReactMethod
    fun enter(aspectRatio: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity mevcut değil")
            return
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED", "PiP Android 8.0+ gerektirir")
            return
        }

        activity.runOnUiThread {
            try {
                val (w, h) = parseRatio(aspectRatio)
                val params = PictureInPictureParams.Builder()
                    .setAspectRatio(Rational(w, h))
                    .also { builder ->
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            builder.setAutoEnterEnabled(true)
                                   .setSeamlessResizeEnabled(true)
                        }
                    }
                    .build()
                activity.enterPictureInPictureMode(params)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PIP_ERROR", e.message)
            }
        }
    }

    /** PiP modundan çık (uygulamayı tam ekrana geri getir) */
    @ReactMethod
    fun exit(promise: Promise) {
        val activity = currentActivity
        if (activity == null) { promise.reject("NO_ACTIVITY", "Activity mevcut değil"); return }
        activity.runOnUiThread {
            try {
                val intent = Intent(reactContext, activity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                }
                activity.startActivity(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PIP_ERROR", e.message)
            }
        }
    }

    /** Cihazın PiP destekleyip desteklemediğini sorgula */
    @ReactMethod
    fun isSupported(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
    }

    /** Şu an PiP modunda mı? */
    @ReactMethod
    fun isActive(promise: Promise) {
        val activity = currentActivity
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            promise.resolve(activity?.isInPictureInPictureMode == true)
        } else {
            promise.resolve(false)
        }
    }

    // ── React Native event listener ────────────────────────────────────────
    fun onPiPModeChanged(active: Boolean) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onPiPModeChange", active)
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    // ── Helpers ───────────────────────────────────────────────────────────
    private fun parseRatio(ratio: String): Pair<Int, Int> {
        return when (ratio) {
            "4:3"  -> 4 to 3
            "1:1"  -> 1 to 1
            "9:16" -> 9 to 16
            else   -> 16 to 9  // varsayılan
        }
    }
}
