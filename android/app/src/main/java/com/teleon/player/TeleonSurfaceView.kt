// android/app/src/main/java/com/teleon/player/TeleonSurfaceView.kt
package com.teleon.player

import android.content.Context
import android.view.SurfaceHolder
import android.view.SurfaceView
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IVLCVout

/**
 * VLC video çıkışının bağlandığı native SurfaceView.
 * React Native ViewManager tarafından oluşturulur ve yönetilir.
 */
class TeleonSurfaceView(context: Context) : SurfaceView(context),
    SurfaceHolder.Callback, IVLCVout.Callback {

    private var vlcPlayer: MediaPlayer? = null

    init {
        holder.addCallback(this)
        // Şeffaf arka plan — video üstüne overlay çizmek için
        setZOrderMediaOverlay(false)
    }

    // ── VLC bağlama ───────────────────────────────────────────────────────────
    fun attachPlayer(player: MediaPlayer) {
        vlcPlayer = player
        val vout = player.vlcVout
        vout.setVideoView(this)
        vout.addCallback(this)
        if (holder.surface?.isValid == true) {
            vout.attachViews()
        }
    }

    fun detachPlayer() {
        vlcPlayer?.vlcVout?.let { vout ->
            vout.removeCallback(this)
            vout.detachViews()
        }
        vlcPlayer = null
    }

    // ── SurfaceHolder.Callback ────────────────────────────────────────────────
    override fun surfaceCreated(holder: SurfaceHolder) {
        vlcPlayer?.vlcVout?.attachViews()
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        vlcPlayer?.vlcVout?.setWindowSize(width, height)
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        vlcPlayer?.vlcVout?.detachViews()
    }

    // ── IVLCVout.Callback ─────────────────────────────────────────────────────
    override fun onNewLayout(
        vlcVout: IVLCVout,
        width: Int, height: Int,
        visibleWidth: Int, visibleHeight: Int,
        sarNum: Int, sarDen: Int
    ) {
        if (width * height == 0) return
        // Aspect ratio koru
        post {
            val parent = parent as? android.view.View ?: return@post
            val pW = parent.width.toFloat()
            val pH = parent.height.toFloat()
            val vW = width.toFloat()
            val vH = height.toFloat()
            val scale = minOf(pW / vW, pH / vH)
            val newW  = (vW * scale).toInt()
            val newH  = (vH * scale).toInt()
            val lp    = layoutParams
            lp.width  = newW
            lp.height = newH
            layoutParams = lp
            vlcVout.setWindowSize(newW, newH)
        }
    }

    override fun onSurfacesCreated(vlcVout: IVLCVout) {}
    override fun onSurfacesDestroyed(vlcVout: IVLCVout) {}
}
