// android/app/src/main/java/com/teleon/TeleonPackage.kt
package com.teleon

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.teleon.player.TeleonPlayerModule
import com.teleon.player.TeleonPlayerViewManager
import com.teleon.database.TeleonDatabaseModule
import com.teleon.pip.PiPModule
import com.teleon.epg.EPGReminderModule

class TeleonPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
        listOf(
            TeleonPlayerModule(ctx),
            TeleonDatabaseModule(ctx),
            PiPModule(ctx),
            EPGReminderModule(ctx),
        )

    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        listOf(
            TeleonPlayerViewManager(ctx),
        )
}
