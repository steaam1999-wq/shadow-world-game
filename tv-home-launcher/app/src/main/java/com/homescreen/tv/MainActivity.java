package com.homescreen.tv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * The TV home screen: assets/index.html (copied from tv-home-web/) in a full-screen WebView.
 *
 * The page draws everything; this activity is the launcher around it. It answers the Home button, passes the
 * remote's Back to the page, and gives the page a small bridge (window.Android) to start installed apps, open
 * system settings and the TV inputs, and list installed apps for the "add app" dialog.
 */
public class MainActivity extends Activity {

    /** The page's origin. A fixed https origin keeps localStorage (the user's tiles and settings) between starts. */
    static final String ORIGIN = "https://home.tv/";
    static final String YANDEX_BROWSER = "com.yandex.browser.tv";

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Lets laptop Chrome inspect the page over ADB (chrome://inspect).
        WebView.setWebContentsDebuggingEnabled(true);

        // Smoothness on a weak TV: GPU-composited window and WebView, whole screen rasterised ahead of movement.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        web = new WebView(this);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        configure(web);
        web.setWebViewClient(new HomeClient());
        web.addJavascriptInterface(new Bridge(), "Android");
        setContentView(web);

        web.loadDataWithBaseURL(ORIGIN, readAsset("index.html"), "text/html", "utf-8", null);
        web.requestFocus();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configure(WebView view) {
        WebSettings s = view.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportMultipleWindows(false);
        s.setOffscreenPreRaster(true);
        s.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);   // fonts from cache, no network wait at boot
        view.setBackgroundColor(Color.BLACK);
        view.setFocusable(true);
        view.setFocusableInTouchMode(true);
        view.setVerticalScrollBarEnabled(false);
        view.setHorizontalScrollBarEnabled(false);
    }

    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (IOException e) {
            return "<body style='background:#000;color:#fff;font:24px sans-serif;padding:40px'>"
                    + "Нет файла экрана (index.html). Пересоберите приложение.</body>";
        }
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    /** Home pressed while the home screen is already on top: back to the first tile, dialogs closed. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        js("window.tvHome&&tvHome()");
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
            web.requestFocus();
        }
        js("window.tvResume&&tvResume()");
    }

    @Override
    protected void onPause() {
        // Keep the page alive but quiet while an app is on top (the animated background stops drawing).
        if (web != null) web.onPause();
        super.onPause();
    }

    /** A launcher never closes on Back: the page closes its own dialogs and returns focus home. */
    @Override
    public void onBackPressed() {
        js("window.tvBack&&tvBack()");
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_UP) js("window.tvBack&&tvBack()");
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    // ---- starting things -------------------------------------------------------------------------------

    private Intent launchIntentFor(String pkg) {
        PackageManager pm = getPackageManager();
        Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (i == null) i = pm.getLaunchIntentForPackage(pkg);
        if (i != null) i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        return i;
    }

    private boolean isInstalled(String pkg) {
        try {
            getPackageManager().getPackageInfo(pkg, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    private void start(Intent intent) {
        runOnUiThread(() -> {
            try {
                startActivity(intent);
            } catch (ActivityNotFoundException | SecurityException e) {
                Toast.makeText(this, R.string.cannot_open, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void openUrl(String url) {
        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (isInstalled(YANDEX_BROWSER)) {
            Intent yandex = new Intent(view).setPackage(YANDEX_BROWSER);
            if (yandex.resolveActivity(getPackageManager()) != null) {
                start(yandex);
                return;
            }
        }
        start(view);
    }

    private void openSettings(String action) {
        Intent wanted = new Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (wanted.resolveActivity(getPackageManager()) == null) {
            wanted = new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        }
        start(wanted);
    }

    /** The TV's own inputs screen (HDMI, tuner): TCL's live TV app, else the generic Android TV ones. */
    private void openInputs() {
        String[] candidates = {"com.tcl.tv", "com.tcl.tvinput", "com.android.tv", "com.google.android.tv"};
        for (String p : candidates) {
            Intent i = launchIntentFor(p);
            if (i != null) {
                start(i);
                return;
            }
        }
        openSettings(Settings.ACTION_SETTINGS);
    }

    private String installedApps() {
        PackageManager pm = getPackageManager();
        Map<String, String> byLabel = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        String[] categories = {Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER};
        for (String category : categories) {
            Intent q = new Intent(Intent.ACTION_MAIN).addCategory(category);
            List<ResolveInfo> found = pm.queryIntentActivities(q, 0);
            for (ResolveInfo r : found) {
                String pkg = r.activityInfo.packageName;
                if (pkg.equals(getPackageName())) continue;
                String label = String.valueOf(r.loadLabel(pm));
                if (!byLabel.containsValue(pkg)) byLabel.put(label + "\u0000" + pkg, pkg);
            }
        }
        JSONArray out = new JSONArray();
        try {
            for (Map.Entry<String, String> e : byLabel.entrySet()) {
                String label = e.getKey().substring(0, e.getKey().indexOf('\u0000'));
                out.put(new JSONObject().put("pkg", e.getValue()).put("label", label));
            }
        } catch (Exception ignored) {
            // org.json only throws for NaN numbers; labels and package names are strings.
        }
        return out.toString();
    }

    /** The app's own launcher icon as a PNG data URL, for the page's tiles. Empty if none is installed. */
    private String iconDataUrl(String packages) {
        PackageManager pm = getPackageManager();
        for (String p : packages.split(",")) {
            String pkg = p.trim();
            if (pkg.isEmpty()) continue;
            try {
                Drawable d = pm.getApplicationIcon(pkg);
                int size = 128;
                Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bmp);
                d.setBounds(0, 0, size, size);
                d.draw(canvas);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
                bmp.recycle();
                return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            } catch (PackageManager.NameNotFoundException e) {
                // try the next candidate package
            } catch (RuntimeException e) {
                return "";
            }
        }
        return "";
    }

    // ---- the page's bridge -----------------------------------------------------------------------------

    /** Called from the page as window.Android.*; runs on a WebView thread, so UI work goes through start(). */
    final class Bridge {
        /** Starts the first installed package of a comma-separated list. False if none is installed. */
        @JavascriptInterface
        public boolean launch(String packages) {
            if (packages == null) return false;
            for (String p : packages.split(",")) {
                String pkg = p.trim();
                if (pkg.isEmpty()) continue;
                Intent i = launchIntentFor(pkg);
                if (i != null) {
                    start(i);
                    return true;
                }
            }
            return false;
        }

        @JavascriptInterface
        public void openUrl(String url) {
            if (url != null && (url.startsWith("https://") || url.startsWith("http://"))) {
                MainActivity.this.openUrl(url);
            }
        }

        @JavascriptInterface
        public void openSettings(String action) {
            if (action != null && action.startsWith("android.settings.")) MainActivity.this.openSettings(action);
        }

        @JavascriptInterface
        public void openInputs() {
            MainActivity.this.openInputs();
        }

        @JavascriptInterface
        public String icon(String packages) {
            return packages == null ? "" : iconDataUrl(packages);
        }

        @JavascriptInterface
        public String apps() {
            return installedApps();
        }
    }

    /** Links inside the page never replace the home screen: they open in the TV's browser. */
    private final class HomeClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            if (url.startsWith(ORIGIN)) return false;
            if (url.startsWith("http://") || url.startsWith("https://")) openUrl(url);
            return true;
        }
    }
}
