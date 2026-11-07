package com.chromatoons.app;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Minimal, dependency-free ContentProvider that hands out read-only access to a
 * single file under the app's own external files directory. Used so the gallery
 * "open" action can share an ACTION_VIEW uri without FileProvider (and without
 * any AndroidX dependency).
 */
public class MediaProvider extends ContentProvider {

    public static final String AUTHORITY = "bhootiyadreamstv.moboapp.chromatoons.files";

    /** Build a content:// uri that resolves to the given file. */
    public static Uri uriFor(File file) {
        return Uri.parse("content://" + AUTHORITY + "/" + Uri.encode(file.getAbsolutePath()));
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        String path = uri.getPath();
        if (path == null || path.length() < 2) throw new FileNotFoundException(String.valueOf(uri));
        File file = new File(path.substring(1));
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public String getType(Uri uri) {
        String p = uri.getPath();
        if (p == null) return null;
        String l = p.toLowerCase();
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
        if (l.endsWith(".mp4")) return "video/mp4";
        if (l.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection,
                        String[] selectionArgs, String sortOrder) {
        return null;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }
}
