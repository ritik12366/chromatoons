package com.chromatoons.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * Chroma Toons — plain Android WebView host for the free web build.
 *
 * This replaces Unity entirely: the studio UI/engine lives in the www/ assets
 * (HTML/CSS/JS) and is exposed to the page through the {@code ChromaNative}
 * JavaScript bridge (file saving, gallery listing, mic permission, exit).
 */
public class MainActivity extends AppCompatActivity {

    private static final int REQ_RECORD_AUDIO = 101;

    private WebView web;
    private WebViewAssetLoader assetLoader;
    private PermissionRequest pendingPermissionRequest;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        setContentView(web);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view, android.webkit.WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> grantWebRequest(request));
            }
        });

        web.addJavascriptInterface(new Bridge(), "ChromaNative");
        web.loadUrl("https://appassets.androidplatform.net/assets/index.html");

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                web.evaluateJavascript("(window.chromaBack && window.chromaBack()) || false", value -> {
                    if (!"true".equals(value)) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                    }
                });
            }
        });
    }

    /**
     * The WebView granted its own permission request, but the app must ALSO hold
     * the Android runtime permission (RECORD_AUDIO) before the mic actually works.
     */
    private void grantWebRequest(final PermissionRequest request) {
        boolean wantsAudio = false;
        for (String res : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)) { wantsAudio = true; break; }
        }
        if (wantsAudio && ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            pendingPermissionRequest = request;
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO}, REQ_RECORD_AUDIO);
            return;
        }
        request.grant(request.getResources());
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_RECORD_AUDIO || pendingPermissionRequest == null) return;
        boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        if (granted) {
            pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
        } else {
            pendingPermissionRequest.deny();
            Toast.makeText(this, "Microphone permission is needed for lip sync and audio recording",
                    Toast.LENGTH_LONG).show();
        }
        pendingPermissionRequest = null;
    }

    private void scan(File file) {
        try {
            MediaScannerConnection.scanFile(this,
                    new String[]{file.getAbsolutePath()}, null, null);
        } catch (Exception ignored) { }
    }

    /** JavaScript bridge exposed to the web app as window.ChromaNative. */
    public class Bridge {

        @JavascriptInterface
        public String saveImage(String base64, String name) {
            return writeFile(base64, name, "image");
        }

        @JavascriptInterface
        public String saveVideo(String base64, String name) {
            return writeFile(base64, name, "video");
        }

        @JavascriptInterface
        public String saveDocument(String base64, String name) {
            return writeFile(base64, name, "document");
        }

        private String writeFile(String base64, String name, String kind) {
            try {
                File dir;
                if ("image".equals(kind)) {
                    dir = new File(getExternalFilesDir(android.os.Environment.DIRECTORY_PICTURES), "ChromaToons");
                } else if ("video".equals(kind)) {
                    dir = new File(getExternalFilesDir(android.os.Environment.DIRECTORY_MOVIES), "ChromaToons");
                } else {
                    dir = new File(getExternalFilesDir(android.os.Environment.DIRECTORY_DOCUMENTS), "ChromaToons");
                }
                if (!dir.exists()) dir.mkdirs();
                File out = new File(dir, name);
                byte[] data = Base64.decode(base64, Base64.DEFAULT);
                try (FileOutputStream fos = new FileOutputStream(out)) {
                    fos.write(data);
                }
                scan(out);
                return out.getAbsolutePath();
            } catch (Exception e) {
                return null;
            }
        }

        @JavascriptInterface
        public String getSavedMedia() {
            List<JSONObject> out = new ArrayList<>();
            String[] subDirs = {
                    android.os.Environment.DIRECTORY_MOVIES,
                    android.os.Environment.DIRECTORY_PICTURES
            };
            for (String sub : subDirs) {
                File dir = new File(getExternalFilesDir(sub), "ChromaToons");
                File[] files = dir.listFiles();
                if (files == null) continue;
                for (File f : files) {
                    try {
                        JSONObject o = new JSONObject();
                        o.put("id", "native_" + f.getName());
                        o.put("name", f.getName());
                        o.put("type", f.getName().endsWith(".png") || f.getName().endsWith(".jpg") ? "image" : "video");
                        o.put("ts", f.lastModified());
                        o.put("size", f.length());
                        o.put("path", f.getAbsolutePath());
                        out.add(o);
                    } catch (Exception ignored) { }
                }
            }
            Collections.sort(out, Comparator.comparingLong(o -> -o.optLong("ts")));
            return new JSONArray(out).toString();
        }

        @JavascriptInterface
        public void openFile(String path) {
            try {
                File file = new File(path);
                Uri uri = FileProvider.getUriForFile(MainActivity.this,
                        getPackageName() + ".fileprovider", file);
                String type = path.endsWith(".png") ? "image/png"
                        : (path.endsWith(".jpg") ? "image/jpeg" : "video/*");
                Intent intent = new Intent(Intent.ACTION_VIEW)
                        .setDataAndType(uri, type)
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(intent, "Open"));
            } catch (Exception e) {
                toast("No app to open this file");
            }
        }

        @JavascriptInterface
        public void deleteFile(String path) {
            try {
                File f = new File(path);
                if (f.exists()) f.delete();
                scan(f);
            } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(MainActivity.this::finish);
        }

        @JavascriptInterface
        public void toast(String msg) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, msg,
                    Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public String platform() {
            return "android";
        }
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }
}
