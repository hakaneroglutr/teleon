// android/app/src/main/java/com/teleon/player/TeleonPlayerViewManager.kt
package com.teleon.player

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * React Native'e TeleonSurfaceView'i "TeleonVideoView" adıyla tanıtır.
 * JS tarafında: <TeleonVideoView paused={false} />
 */
class TeleonPlayerViewManager(
    private val reactContext: ReactApplicationContext
) : SimpleViewManager<TeleonSurfaceView>() {

    override fun getName() = "TeleonVideoView"

    override fun createViewInstance(context: ThemedReactContext): TeleonSurfaceView {
        return TeleonSurfaceView(context)
    }

    /**
     * Oynatıcı instance ID — TeleonPlayerModule'deki aktif oynatıcıyı
     * bu view'a bağlamak için kullanılır.
     */
    @ReactProp(name = "playerId")
    fun setPlayerId(view: TeleonSurfaceView, playerId: String?) {
        if (playerId == null) {
            view.detachPlayer()
            return
        }
        // Singleton PlayerModule üzerinden aktif VLC oynatıcısına eriş
        val module = reactContext
            .getNativeModule(TeleonPlayerModule::class.java)
        module?.currentVlcPlayer?.let { player ->
            view.attachPlayer(player)
        }
    }

    override fun onDropViewInstance(view: TeleonSurfaceView) {
        view.detachPlayer()
        super.onDropViewInstance(view)
    }
}
