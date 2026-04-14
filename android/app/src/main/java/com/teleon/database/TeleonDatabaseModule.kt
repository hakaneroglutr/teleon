// android/app/src/main/java/com/teleon/database/TeleonDatabaseModule.kt
package com.teleon.database

import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.content.ContentValues
import com.facebook.react.bridge.*

// ── Database helper ───────────────────────────────────────────────────────────
class TeleonDBHelper(context: android.content.Context)
    : SQLiteOpenHelper(context, "teleon.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        // Ana tablolar — APK'dan çıkarılan şemalar
        db.execSQL("""CREATE TABLE IF NOT EXISTS channels (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            server_id INTEGER NOT NULL,
            channel VARCHAR(100) NOT NULL
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS channelsplayer (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            server_id INTEGER NOT NULL,
            channel VARCHAR(100) NOT NULL
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS favourite (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            channel VARCHAR(500) NOT NULL UNIQUE
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS favourite696 (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            channel VARCHAR(500) NOT NULL UNIQUE
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS livechhistory (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            channel VARCHAR(500) NOT NULL UNIQUE
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS vodhistory (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            channel VARCHAR(500) NOT NULL UNIQUE
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS vodfavourite (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            channel VARCHAR(500) NOT NULL UNIQUE
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS seriesfavourite (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            channel VARCHAR(500) NOT NULL UNIQUE
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS serieshistory (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            channel VARCHAR(500) NOT NULL UNIQUE
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS servers (
            pk_id INTEGER PRIMARY KEY NOT NULL,
            server VARCHAR(100) NOT NULL,
            servername VARCHAR(100) NOT NULL,
            mac VARCHAR(50),
            user VARCHAR(100),
            password VARCHAR(100),
            use_credential INTEGER,
            is_active INTEGER
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS serversplayer (
            pk_id INTEGER PRIMARY KEY NOT NULL,
            server VARCHAR(100) NOT NULL,
            servername VARCHAR(100) NOT NULL,
            mac VARCHAR(50),
            user VARCHAR(100),
            password VARCHAR(100),
            use_credential INTEGER,
            is_active INTEGER
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS fastcodePortal (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            portalid TEXT,
            portalname TEXT,
            portaladdress TEXT,
            portalcode TEXT
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS recent (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            NAME TEXT,
            TIME TEXT,
            TOTALTIME TEXT
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS recentChannel (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            CATID TEXT,
            CATNAME TEXT,
            CHNAME TEXT
        )""")
        db.execSQL("""CREATE TABLE IF NOT EXISTS seriesseasonepisodeinfo (
            pk_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            SERIES_NAME TEXT,
            SEASON_NAME TEXT,
            EPISODE_NAME TEXT
        )""")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Gelecekte migrasyon burada
    }
}

// ── React Native Module ───────────────────────────────────────────────────────
class TeleonDatabaseModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "TeleonDatabaseModule"

    private val db: SQLiteDatabase by lazy {
        TeleonDBHelper(reactContext).writableDatabase
    }

    // ── Channels ──────────────────────────────────────────────────────────────
    @ReactMethod fun insertChannel(serverId: Int, channelJson: String, promise: Promise) {
        try {
            val cv = ContentValues().apply {
                put("server_id", serverId)
                put("channel",   channelJson)
            }
            val id = db.insert("channels", null, cv)
            promise.resolve(id.toInt())
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun getChannels(serverId: Int, promise: Promise) {
        try {
            val arr = Arguments.createArray()
            val c = db.query("channels", arrayOf("channel"), "server_id=?", arrayOf(serverId.toString()), null, null, "pk_id ASC")
            while (c.moveToNext()) arr.pushString(c.getString(0))
            c.close()
            promise.resolve(arr)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun clearChannels(serverId: Int, promise: Promise) {
        try {
            db.delete("channels", "server_id=?", arrayOf(serverId.toString()))
            promise.resolve(null)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    // ── Favourites ────────────────────────────────────────────────────────────
    private fun insertUnique(table: String, value: String, promise: Promise) {
        try {
            val cv = ContentValues().apply { put("channel", value) }
            db.insertWithOnConflict(table, null, cv, SQLiteDatabase.CONFLICT_IGNORE)
            promise.resolve(null)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    private fun deleteRow(table: String, value: String, promise: Promise) {
        try {
            db.delete(table, "channel=?", arrayOf(value))
            promise.resolve(null)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    private fun getAllRows(table: String, promise: Promise) {
        try {
            val arr = Arguments.createArray()
            val c = db.query(table, arrayOf("channel"), null, null, null, null, "pk_id DESC")
            while (c.moveToNext()) arr.pushString(c.getString(0))
            c.close()
            promise.resolve(arr)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun addFavourite(ch: String, promise: Promise)           = insertUnique("favourite", ch, promise)
    @ReactMethod fun removeFavourite(ch: String, promise: Promise)        = deleteRow("favourite", ch, promise)
    @ReactMethod fun getFavourites(promise: Promise)                       = getAllRows("favourite", promise)

    @ReactMethod fun addVodFavourite(ch: String, promise: Promise)        = insertUnique("vodfavourite", ch, promise)
    @ReactMethod fun removeVodFavourite(ch: String, promise: Promise)     = deleteRow("vodfavourite", ch, promise)
    @ReactMethod fun getVodFavourites(promise: Promise)                    = getAllRows("vodfavourite", promise)

    @ReactMethod fun addSeriesFavourite(ch: String, promise: Promise)     = insertUnique("seriesfavourite", ch, promise)
    @ReactMethod fun removeSeriesFavourite(ch: String, promise: Promise)  = deleteRow("seriesfavourite", ch, promise)
    @ReactMethod fun getSeriesFavourites(promise: Promise)                 = getAllRows("seriesfavourite", promise)

    @ReactMethod fun addLiveHistory(ch: String, promise: Promise)         = insertUnique("livechhistory", ch, promise)
    @ReactMethod fun getLiveHistory(promise: Promise)                      = getAllRows("livechhistory", promise)

    @ReactMethod fun addVodHistory(ch: String, promise: Promise)          = insertUnique("vodhistory", ch, promise)
    @ReactMethod fun getVodHistory(promise: Promise)                       = getAllRows("vodhistory", promise)

    @ReactMethod fun addSeriesHistory(ch: String, promise: Promise)       = insertUnique("serieshistory", ch, promise)
    @ReactMethod fun getSeriesHistory(promise: Promise)                    = getAllRows("serieshistory", promise)

    // ── Recent (VOD pozisyonu) ────────────────────────────────────────────────
    @ReactMethod fun upsertRecent(name: String, time: String, totalTime: String, promise: Promise) {
        try {
            val existing = db.query("recent", arrayOf("pk_id"), "NAME=?", arrayOf(name), null, null, null)
            val exists = existing.moveToFirst()
            existing.close()
            val cv = ContentValues().apply {
                put("NAME",      name)
                put("TIME",      time)
                put("TOTALTIME", totalTime)
            }
            if (exists) {
                db.update("recent", cv, "NAME=?", arrayOf(name))
            } else {
                db.insert("recent", null, cv)
            }
            promise.resolve(null)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun getRecent(name: String, promise: Promise) {
        try {
            val c = db.query("recent", arrayOf("NAME","TIME","TOTALTIME"), "NAME=?", arrayOf(name), null, null, null)
            if (c.moveToFirst()) {
                val map = Arguments.createMap()
                map.putString("NAME",      c.getString(0))
                map.putString("TIME",      c.getString(1))
                map.putString("TOTALTIME", c.getString(2))
                promise.resolve(map)
            } else {
                promise.resolve(null)
            }
            c.close()
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    // ── Recent channels ───────────────────────────────────────────────────────
    @ReactMethod fun addRecentChannel(catId: String, catName: String, chName: String, promise: Promise) {
        try {
            // Aynı kanal zaten varsa sil, en üste ekle
            db.delete("recentChannel", "CHNAME=?", arrayOf(chName))
            val cv = ContentValues().apply {
                put("CATID",  catId)
                put("CATNAME", catName)
                put("CHNAME",  chName)
            }
            db.insert("recentChannel", null, cv)
            // Max 50 tut
            db.execSQL("DELETE FROM recentChannel WHERE pk_id NOT IN (SELECT pk_id FROM recentChannel ORDER BY pk_id DESC LIMIT 50)")
            promise.resolve(null)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun getRecentChannels(promise: Promise) {
        try {
            val arr = Arguments.createArray()
            val c = db.query("recentChannel", arrayOf("CATID","CATNAME","CHNAME"), null, null, null, null, "pk_id DESC")
            while (c.moveToNext()) {
                arr.pushMap(Arguments.createMap().apply {
                    putString("CATID",  c.getString(0))
                    putString("CATNAME", c.getString(1))
                    putString("CHNAME",  c.getString(2))
                })
            }
            c.close()
            promise.resolve(arr)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    // ── Servers ───────────────────────────────────────────────────────────────
    @ReactMethod fun insertServer(server: ReadableMap, promise: Promise) {
        try {
            val cv = ContentValues().apply {
                put("server",          server.getString("server") ?: "")
                put("servername",      server.getString("servername") ?: "")
                put("mac",             server.getString("mac") ?: "")
                put("user",            server.getString("user") ?: "")
                put("password",        server.getString("password") ?: "")
                put("use_credential",  if (server.hasKey("use_credential")) server.getInt("use_credential") else 0)
                put("is_active",       if (server.hasKey("is_active"))      server.getInt("is_active")      else 1)
            }
            val id = db.insert("servers", null, cv)
            promise.resolve(id.toInt())
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun deleteServer(pkId: Int, promise: Promise) {
        try {
            db.delete("servers", "pk_id=?", arrayOf(pkId.toString()))
            promise.resolve(null)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun getServers(promise: Promise) {
        try {
            val arr = Arguments.createArray()
            val c = db.query("servers", null, null, null, null, null, "pk_id ASC")
            while (c.moveToNext()) {
                arr.pushMap(Arguments.createMap().apply {
                    putInt("pk_id",          c.getInt(c.getColumnIndexOrThrow("pk_id")))
                    putString("server",      c.getString(c.getColumnIndexOrThrow("server")) ?: "")
                    putString("servername",  c.getString(c.getColumnIndexOrThrow("servername")) ?: "")
                    putString("mac",         c.getString(c.getColumnIndexOrThrow("mac")) ?: "")
                    putString("user",        c.getString(c.getColumnIndexOrThrow("user")) ?: "")
                    putString("password",    c.getString(c.getColumnIndexOrThrow("password")) ?: "")
                    putInt("use_credential", c.getInt(c.getColumnIndexOrThrow("use_credential")))
                    putInt("is_active",      c.getInt(c.getColumnIndexOrThrow("is_active")))
                })
            }
            c.close()
            promise.resolve(arr)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    // ── FastCode Portals ──────────────────────────────────────────────────────
    @ReactMethod fun insertPortal(portal: ReadableMap, promise: Promise) {
        try {
            val cv = ContentValues().apply {
                put("portalid",      portal.getString("portalid") ?: "")
                put("portalname",    portal.getString("portalname") ?: "")
                put("portaladdress", portal.getString("portaladdress") ?: "")
                put("portalcode",    portal.getString("portalcode") ?: "")
            }
            val id = db.insert("fastcodePortal", null, cv)
            promise.resolve(id.toInt())
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun deletePortal(id: Int, promise: Promise) {
        try {
            db.delete("fastcodePortal", "id=?", arrayOf(id.toString()))
            promise.resolve(null)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun getPortals(promise: Promise) {
        try {
            val arr = Arguments.createArray()
            val c = db.query("fastcodePortal", null, null, null, null, null, "id ASC")
            while (c.moveToNext()) {
                arr.pushMap(Arguments.createMap().apply {
                    putInt("id",             c.getInt(c.getColumnIndexOrThrow("id")))
                    putString("portalid",    c.getString(c.getColumnIndexOrThrow("portalid")) ?: "")
                    putString("portalname",  c.getString(c.getColumnIndexOrThrow("portalname")) ?: "")
                    putString("portaladdress", c.getString(c.getColumnIndexOrThrow("portaladdress")) ?: "")
                    putString("portalcode",  c.getString(c.getColumnIndexOrThrow("portalcode")) ?: "")
                })
            }
            c.close()
            promise.resolve(arr)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    // ── Series progress ───────────────────────────────────────────────────────
    @ReactMethod fun upsertSeriesProgress(seriesName: String, seasonName: String, episodeName: String, promise: Promise) {
        try {
            val existing = db.query("seriesseasonepisodeinfo", arrayOf("pk_id"), "SERIES_NAME=?", arrayOf(seriesName), null, null, null)
            val exists = existing.moveToFirst()
            existing.close()
            val cv = ContentValues().apply {
                put("SERIES_NAME",  seriesName)
                put("SEASON_NAME",  seasonName)
                put("EPISODE_NAME", episodeName)
            }
            if (exists) db.update("seriesseasonepisodeinfo", cv, "SERIES_NAME=?", arrayOf(seriesName))
            else        db.insert("seriesseasonepisodeinfo", null, cv)
            promise.resolve(null)
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }

    @ReactMethod fun getSeriesProgress(seriesName: String, promise: Promise) {
        try {
            val c = db.query("seriesseasonepisodeinfo", arrayOf("SEASON_NAME","EPISODE_NAME"), "SERIES_NAME=?", arrayOf(seriesName), null, null, null)
            if (c.moveToFirst()) {
                promise.resolve(Arguments.createMap().apply {
                    putString("season",  c.getString(0))
                    putString("episode", c.getString(1))
                })
            } else {
                promise.resolve(null)
            }
            c.close()
        } catch (e: Exception) { promise.reject("DB_ERR", e.message) }
    }
}
