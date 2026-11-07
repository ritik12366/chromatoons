package com.chromatoons.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * Chroma Toons - plain Android WebView host for the free web build.
 *
 * Replaces Unity entirely: the studio UI/engine lives in the www/ assets
 * (HTML/CSS/JS). A tiny built-in HTTP server on 127.0.0.1 serves those assets,
 * so the page runs from a real http:// origin (fetch, storage and media all
 * behave). The page talks to native code through the {@code ChromaNative}
 * JavaScript bridge (file saving, gallery listing, mic permission, exit).
 *
 * Deliberately has NO third-party dependencies (no AndroidX) so the APK can
 * always be built from a clean Android SDK.
 */
public class MainActivity extends Activity {

    private static final int REQ_RECORD_AUDIO = 101;

    private WebView web;
    private ServerSocket server;
    private PermissionRequest pendingPermissionRequest;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        setContentView(web);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setWebViewClient(new WebViewClient());

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> grantWebRequest(request));
            }
        });

        web.addJavascriptInterface(new Bridge(), "ChromaNative");

        try {
            startAssetServer();
            web.loadUrl("http://127.0.0.1:" + server.getLocalPort() + "/index.html");
        } catch (IOException e) {
            // Last-resort fallback if the loopback socket is unavailable.
            web.loadUrl("file:///android_asset/index.html");
        }
    }

    /** Android back button -> let the web app handle it, else close. */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.chromaBack && window.chromaBack()) || false", value -> {
            if (!"true".equals(value)) {
                MainActivity.super.onBackPressed();
            }
        });
    }

    // ---- tiny asset server --------------------------------------------------

    private void startAssetServer() throws IOException {
        server = new ServerSocket(0, 0, InetAddress.getByName("127.0.0.1"));
        Thread t = new Thread(this::acceptLoop, "asset-server");
        t.setDaemon(true);
        t.start();
    }

    private void acceptLoop() {
        while (true) {
            try {
                handleRequest(server.accept());
            } catch (Exception e) {
                if (server.isClosed()) return;
            }
        }
    }

    private void handleRequest(Socket socket) {
        try (Socket s = socket) {
            BufferedReader in = new BufferedReader(
                    new InputStreamReader(s.getInputStream(), "UTF-8"));
            String requestLine = in.readLine();
            if (requestLine == null) return;
            while (true) {
                String line = in.readLine();
                if (line == null || line.isEmpty()) break;
            }

            String path = "/index.html";
            String[] parts = requestLine.split(" ");
            if (parts.length >= 2) path = parts[1];
            int cut = path.indexOf('?');
            if (cut < 0) cut = path.indexOf('#');
            if (cut >= 0) path = path.substring(0, cut);
            if (path.equals("/") || path.isEmpty()) path = "/index.html";

            String asset = path.startsWith("/") ? path.substring(1) : path;
            OutputStream out = s.getOutputStream();
            if (asset.contains("..")) {
                writeResponse(out, 400, "text/plain", "bad request".getBytes("UTF-8"));
                return;
            }
            byte[] data;
            try (InputStream a = getAssets().open(asset)) {
                data = readAll(a);
            } catch (IOException notFound) {
                writeResponse(out, 404, "text/plain", "not found".getBytes("UTF-8"));
                return;
            }
            writeResponse(out, 200, mimeType(asset), data);
        } catch (Exception ignored) {
            // client went away; nothing to do
        }
    }

    private static void writeResponse(OutputStream out, int code, String type, byte[] body)
            throws IOException {
        String status = code == 200 ? "200 OK" : (code == 404 ? "404 Not Found" : "400 Bad Request");
        StringBuilder h = new StringBuilder();
        h.append("HTTP/1.1 ").append(status).append("\r\n");
        h.append("Content-Type: ").append(type).append("\r\n");
        h.append("Content-Length: ").append(body.length).append("\r\n");
        h.append("Cache-Control: no-store\r\n");
        h.append("Access-Control-Allow-Origin: *\r\n");
        h.append("Connection: close\r\n\r\n");
        out.write(h.toString().getBytes("UTF-8"));
        out.write(body);
        out.flush();
    }

    private static byte[] readAll(InputStream in) throws IOException {
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
        return bos.toByteArray();
    }

    private static String mimeType(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html; charset=utf-8";
        if (p.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (p.endsWith(".css")) return "text/css; charset=utf-8";
        if (p.endsWith(".json") || p.endsWith(".webmanifest")) return "application/json; charset=utf-8";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".wasm")) return "application/wasm";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".wav")) return "audio/wav";
        return "application/octet-stream";
    }

    // ---- microphone permission ---------------------------------------------

    /**
     * The WebView granted its own permission request, but the app must ALSO hold
     * the Android runtime permission (RECORD_AUDIO) before the mic actually works.
     */
    private void grantWebRequest(final PermissionRequest request) {
        boolean wantsAudio = false;
        for (String res : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)) {
                wantsAudio = true;
                break;
            }
        }
        if (wantsAudio && checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            pendingPermissionRequest = request;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_RECORD_AUDIO);
            return;
        }
        request.grant(request.getResources());
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_RECORD_AUDIO || pendingPermissionRequest == null) return;
        boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        if (granted) {
            pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
        } else {
            pendingPermissionRequest.deny();
            toast("Microphone permission is needed for lip sync and audio recording");
        }
        pendingPermissionRequest = null;
    }

    // ---- helpers ------------------------------------------------------------

    private void scan(File file) {
        try {
            MediaScannerConnection.scanFile(this,
                    new String[]{file.getAbsolutePath()}, null, null);
        } catch (Exception ignored) { }
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
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
                    dir = new File(getExternalFilesDir(Environment.DIRECTORY_PICTURES), "ChromaToons");
                } else if ("video".equals(kind)) {
                    dir = new File(getExternalFilesDir(Environment.DIRECTORY_MOVIES), "ChromaToons");
                } else {
                    dir = new File(getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "ChromaToons");
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
                    Environment.DIRECTORY_MOVIES,
                    Environment.DIRECTORY_PICTURES
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
                        o.put("type", f.getName().endsWith(".png") || f.getName().endsWith(".jpg")
                                ? "image" : "video");
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
                Uri uri = MediaProvider.uriFor(file);
                String p = path.toLowerCase();
                String type = p.endsWith(".png") ? "image/png"
                        : (p.endsWith(".jpg") || p.endsWith(".jpeg")) ? "image/jpeg"
                        : p.endsWith(".mp4") ? "video/mp4" : "video/*";
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
            runOnUiThread(() -> finish());
        }

        @JavascriptInterface
        public void toast(String msg) {
            runOnUiThread(() -> MainActivity.this.toast(msg));
        }

        @JavascriptInterface
        public String platform() {
            return "android";
        }
    }
}
