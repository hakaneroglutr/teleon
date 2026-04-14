// android/app/src/main/java/com/teleon/player/TeleonPlayerModule.kt  (Faz 3)
package com.teleon.player

import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer

class TeleonPlayerModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "TeleonPlayerModule"

    private var libVLC: LibVLC? = null
    var currentVlcPlayer: MediaPlayer? = null
        private set
    private var vlcPlayer: MediaPlayer?
        get()      = currentVlcPlayer
        set(value) { currentVlcPlayer = value }
    private var exoPlayer:   ExoPlayer? = null
    private var activeEngine: String    = "vlc"

    private val mainHandler  = Handler(Looper.getMainLooper())
    private var progressJob: Runnable? = null

    @ReactMethod
    fun play(url: String, engine: String, promise: Promise) {
        mainHandler.post {
            try {
                stopAll()
                activeEngine = engine.lowercase()
                if (activeEngine == "exo") playWithExo(url) else playWithVLC(url)
                startProgressPoll()
                launchService()
                promise.resolve(null)
            } catch (e: Exception) { promise.reject("PLAYER_ERROR", e.message, e) }
        }
    }

    private fun playWithVLC(url: String) {
        libVLC = LibVLC(reactContext, arrayListOf(
            "--network-caching=3000", "--http-reconnect", "--avcodec-hw=any",
        ))
        vlcPlayer = MediaPlayer(libVLC).apply {
            val media = Media(libVLC, android.net.Uri.parse(url)).apply {
                addOption(":network-caching=3000")
            }
            setMedia(media); media.release()
            setEventListener { e ->
                when (e.type) {
                    MediaPlayer.Event.Playing          -> sendState("playing")
                    MediaPlayer.Event.Paused           -> sendState("paused")
                    MediaPlayer.Event.Stopped          -> sendState("stopped")
                    MediaPlayer.Event.Buffering        -> { sendState("loading"); sendBuffering(true) }
                    MediaPlayer.Event.EncounteredError -> {
                        sendState("error")
                        sendEvent("onPlayerError", Arguments.createMap().apply {
                            putInt("code", -1); putString("message", "VLC error")
                        })
                    }
                    MediaPlayer.Event.Vout -> {
                        sendBuffering(false)
                        if (e.voutCount > 0) sendEvent("onVideoSize", Arguments.createMap().apply {
                            putInt("width", videoWidth); putInt("height", videoHeight)
                        })
                    }
                }
            }
            play()
        }
    }

    private fun playWithExo(url: String) {
        exoPlayer = ExoPlayer.Builder(reactContext).build().apply {
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    when (state) {
                        Player.STATE_BUFFERING -> { sendState("loading"); sendBuffering(true) }
                        Player.STATE_READY     -> { sendState("playing"); sendBuffering(false) }
                        Player.STATE_ENDED     -> sendState("stopped")
                        Player.STATE_IDLE      -> sendState("idle")
                    }
                }
                override fun onIsPlayingChanged(isPlaying: Boolean) {
                    sendState(if (isPlaying) "playing" else "paused")
                }
                override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                    sendState("error")
                    sendEvent("onPlayerError", Arguments.createMap().apply {
                        putInt("code", error.errorCode); putString("message", error.message ?: "ExoPlayer error")
                    })
                }
                override fun onVideoSizeChanged(sz: androidx.media3.common.VideoSize) {
                    sendEvent("onVideoSize", Arguments.createMap().apply {
                        putInt("width", sz.width); putInt("height", sz.height)
                    })
                }
            })
            setMediaItem(MediaItem.fromUri(url))
            prepare(); playWhenReady = true
        }
    }

    @ReactMethod fun pause(p: Promise)  = runMain { try { if (activeEngine=="vlc") vlcPlayer?.pause() else exoPlayer?.pause(); p.resolve(null) } catch(e:Exception){p.reject("ERR",e.message)} }
    @ReactMethod fun resume(p: Promise) = runMain { try { if (activeEngine=="vlc") vlcPlayer?.play()  else exoPlayer?.play();  p.resolve(null) } catch(e:Exception){p.reject("ERR",e.message)} }
    @ReactMethod fun stop(p: Promise)   = runMain { try { stopAll(); killService(); p.resolve(null) } catch(e:Exception){p.reject("ERR",e.message)} }

    @ReactMethod
    fun seek(positionMs: Double, p: Promise) = runMain {
        try {
            val pos = positionMs.toLong()
            if (activeEngine=="vlc") vlcPlayer?.time = pos else exoPlayer?.seekTo(pos)
            p.resolve(null)
        } catch(e:Exception){p.reject("ERR",e.message)}
    }

    @ReactMethod
    fun seekRelative(offsetMs: Double, p: Promise) = runMain {
        try {
            val off = offsetMs.toLong()
            if (activeEngine=="vlc") {
                vlcPlayer?.time = ((vlcPlayer?.time ?: 0L) + off).coerceAtLeast(0L)
            } else {
                exoPlayer?.seekTo(((exoPlayer?.currentPosition ?: 0L) + off).coerceAtLeast(0L))
            }
            p.resolve(null)
        } catch(e:Exception){p.reject("ERR",e.message)}
    }

    @ReactMethod
    fun setVolume(volume: Double, p: Promise) = runMain {
        try {
            if (activeEngine=="vlc") vlcPlayer?.volume = volume.toInt()
            else exoPlayer?.volume = (volume/100f).toFloat().coerceIn(0f,2f)
            p.resolve(null)
        } catch(e:Exception){p.reject("ERR",e.message)}
    }

    @ReactMethod
    fun setSpeed(speed: Double, p: Promise) = runMain {
        try {
            if (activeEngine=="vlc") vlcPlayer?.rate = speed.toFloat()
            else exoPlayer?.setPlaybackSpeed(speed.toFloat())
            p.resolve(null)
        } catch(e:Exception){p.reject("ERR",e.message)}
    }

    @ReactMethod
    fun getInfo(p: Promise) = runMain {
        try {
            val m = Arguments.createMap()
            if (activeEngine=="vlc" && vlcPlayer!=null) {
                m.putDouble("position",   vlcPlayer!!.time.toDouble())
                m.putDouble("duration",   vlcPlayer!!.length.toDouble())
                m.putBoolean("isPlaying", vlcPlayer!!.isPlaying)
                m.putBoolean("isPaused",  !vlcPlayer!!.isPlaying && vlcPlayer!!.time>0)
                m.putBoolean("isBuffering", false)
                m.putInt("videoWidth",    vlcPlayer!!.videoTrack?.width  ?: 0)
                m.putInt("videoHeight",   vlcPlayer!!.videoTrack?.height ?: 0)
                m.putString("engine", "vlc")
            } else if (activeEngine=="exo" && exoPlayer!=null) {
                m.putDouble("position",   exoPlayer!!.currentPosition.toDouble())
                m.putDouble("duration",   exoPlayer!!.duration.coerceAtLeast(0L).toDouble())
                m.putBoolean("isPlaying", exoPlayer!!.isPlaying)
                m.putBoolean("isPaused",  !exoPlayer!!.isPlaying)
                m.putBoolean("isBuffering", exoPlayer!!.playbackState==Player.STATE_BUFFERING)
                m.putInt("videoWidth",    exoPlayer!!.videoSize.width)
                m.putInt("videoHeight",   exoPlayer!!.videoSize.height)
                m.putString("engine", "exo")
            }
            p.resolve(m)
        } catch(e:Exception){p.reject("ERR",e.message)}
    }

    @ReactMethod
    fun getAudioTracks(p: Promise) = runMain {
        val arr = Arguments.createArray()
        if (activeEngine=="vlc") vlcPlayer?.audioTracks?.forEachIndexed { i, t ->
            arr.pushMap(Arguments.createMap().apply { putInt("id",t.id); putString("name",t.name?:"Track $i"); putString("lang",t.name?:"") })
        }
        p.resolve(arr)
    }

    @ReactMethod fun setAudioTrack(id: Int, p: Promise) = runMain { try { if (activeEngine=="vlc") vlcPlayer?.setAudioTrack(id); p.resolve(null) } catch(e:Exception){p.reject("ERR",e.message)} }

    @ReactMethod
    fun getSubtitleTracks(p: Promise) = runMain {
        val arr = Arguments.createArray()
        if (activeEngine=="vlc") vlcPlayer?.spuTracks?.forEachIndexed { i, t ->
            arr.pushMap(Arguments.createMap().apply { putInt("id",t.id); putString("name",t.name?:"Sub $i"); putString("lang",t.name?:"") })
        }
        p.resolve(arr)
    }

    @ReactMethod fun setSubtitleTrack(id: Int, p: Promise) = runMain { try { if (activeEngine=="vlc") vlcPlayer?.setSpuTrack(id); p.resolve(null) } catch(e:Exception){p.reject("ERR",e.message)} }

    @ReactMethod
    fun enablePiP(p: Promise) {
        reactContext.currentActivity?.let { if (it is MainActivity) it.enterPiPMode() }
        p.resolve(null)
    }

    @ReactMethod fun disablePiP(p: Promise) { p.resolve(null) }

    private fun startProgressPoll() {
        progressJob?.let { mainHandler.removeCallbacks(it) }
        progressJob = object : Runnable {
            override fun run() {
                try {
                    val m = Arguments.createMap()
                    when {
                        activeEngine=="vlc" && vlcPlayer?.isPlaying==true -> {
                            m.putDouble("position", vlcPlayer!!.time.toDouble())
                            m.putDouble("duration", vlcPlayer!!.length.toDouble())
                            m.putDouble("buffered", 0.0)
                            sendEvent("onPlayerProgress", m)
                        }
                        activeEngine=="exo" && exoPlayer?.isPlaying==true -> {
                            m.putDouble("position", exoPlayer!!.currentPosition.toDouble())
                            m.putDouble("duration", exoPlayer!!.duration.coerceAtLeast(0).toDouble())
                            m.putDouble("buffered", exoPlayer!!.bufferedPosition.toDouble())
                            sendEvent("onPlayerProgress", m)
                        }
                    }
                } catch(_: Exception) {}
                mainHandler.postDelayed(this, 1000L)
            }
        }
        mainHandler.post(progressJob!!)
    }

    private fun launchService() {
        try { reactContext.startService(Intent(reactContext, TeleonMediaService::class.java)) }
        catch(_: Exception) {}
    }

    private fun killService() {
        try {
            reactContext.startService(Intent(reactContext, TeleonMediaService::class.java).apply {
                action = TeleonMediaService.ACTION_STOP
            })
        } catch(_: Exception) {}
    }

    private fun stopAll() {
        progressJob?.let { mainHandler.removeCallbacks(it) }
        vlcPlayer?.stop(); vlcPlayer?.release(); vlcPlayer = null
        libVLC?.release(); libVLC = null
        exoPlayer?.release(); exoPlayer = null
    }

    override fun onCatalystInstanceDestroy() { mainHandler.post { stopAll() } }

    private fun sendState(s: String) = sendEvent("onPlayerStateChange", s)
    private fun sendBuffering(v: Boolean) = sendEvent("onBufferingChange",
        Arguments.createMap().apply { putBoolean("isBuffering", v) })
    private fun sendEvent(name: String, data: Any?) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(name, data)
    }

    private fun runMain(block: () -> Unit) = mainHandler.post(block)

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
