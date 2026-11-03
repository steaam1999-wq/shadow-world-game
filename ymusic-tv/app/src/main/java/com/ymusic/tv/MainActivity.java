package com.ymusic.tv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.widget.EditText;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Яндекс Музыка (music.yandex.ru) in a full-screen WebView, made usable with a TV remote.
 *
 * The site does all the work (catalogue, account, history, player); this activity hosts it and adds the TV
 * layer: assets/tv.js (D-pad navigation, remote media keys → the web player) and assets/tv.css (focus ring).
 * The site address is a setting (Menu key), because the site moves between domains.
 * Main-frame links to other sites (ads, redirects) are not opened; only the site and sign-in pages are.
 */
public class MainActivity extends Activity {

    static final String DEFAULT_SITE = "https://music.yandex.ru/";
    /** Sign-in pages that may open inside the app besides the site itself. */
    static final String[] SIGN_IN_HOSTS = {"yandex.ru", "yandex.com", "yandex.by", "yandex.kz", "ya.ru",
            "vk.com", "vk.ru", "id.vk.com", "oauth.vk.com", "telegram.org",
            "oauth.telegram.org", "passport.yandex.ru", "oauth.yandex.ru", "id.yandex.ru", "accounts.google.com"};

    private SharedPreferences prefs;

    private FrameLayout root;
    private WebView web;
    private WebView popup;
    private ProgressBar progress;
    private TextView errorView;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private String tvScript;
    private long lastBackAt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("ymusic", MODE_PRIVATE);
        // Lets laptop Chrome inspect the page over ADB (chrome://inspect): how the TV layer is tuned to the site.
        WebView.setWebContentsDebuggingEnabled(true);
        tvScript = buildTvScript();

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        web = new WebView(this);
        configure(web);
        web.setWebViewClient(new MainClient());
        web.setWebChromeClient(new MainChrome());
        web.addJavascriptInterface(new Bridge(), "TvBridge");
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setVisibility(View.GONE);
        root.addView(progress, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(4),
                Gravity.TOP));

        errorView = new TextView(this);
        errorView.setText(R.string.offline);
        errorView.setTextColor(Color.WHITE);
        errorView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        errorView.setGravity(Gravity.CENTER);
        errorView.setBackgroundColor(Color.BLACK);
        errorView.setVisibility(View.GONE);
        errorView.setFocusable(true);
        errorView.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            web.reload();
            web.requestFocus();
        });
        root.addView(errorView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(root);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(startUrl(getIntent()));
        }
        web.requestFocus();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri data = intent.getData();
        if (data != null) web.loadUrl(startUrl(intent));
    }

    private String startUrl(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        if (data != null && isSiteHost(data.getHost())) return data.toString();
        return site();
    }

    /** The site's address (Menu → «Адрес сайта»), always ending with "/". */
    String site() {
        String s = prefs.getString("site", DEFAULT_SITE);
        return s.endsWith("/") ? s : s + "/";
    }

    /** The configured host and its relatives (music.yandex.*): all count as the site. */
    boolean isSiteHost(String host) {
        if (host == null) return false;
        String h = host.toLowerCase(java.util.Locale.ROOT);
        String siteHost = Uri.parse(site()).getHost();
        if (siteHost != null && (h.equals(siteHost) || h.endsWith("." + siteHost))) return true;
        return h.startsWith("music.yandex.") || h.contains(".music.yandex.");
    }

    boolean isAllowedHost(String host) {
        if (isSiteHost(host)) return true;
        if (host == null) return false;
        for (String h : SIGN_IN_HOSTS) if (host.equals(h) || host.endsWith("." + h)) return true;
        return false;
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
        s.setSupportMultipleWindows(true);          // Telegram and VK sign-in open a popup window
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        s.setUserAgentString(desktopUserAgent(s.getUserAgentString()));
        s.setOffscreenPreRaster(true);   // the whole page is drawn ahead, so scrolling and the ring do not stutter
        view.setBackgroundColor(Color.BLACK);
        view.setFocusable(true);
        view.setFocusableInTouchMode(true);
    }

    /** The desktop layout of the site, with the real Chrome version of this WebView. */
    static String desktopUserAgent(String webViewAgent) {
        String chrome = "Chrome/120.0.0.0";
        Matcher m = Pattern.compile("Chrome/[0-9.]+").matcher(webViewAgent == null ? "" : webViewAgent);
        if (m.find()) chrome = m.group();
        return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " + chrome
                + " Safari/537.36";
    }

    private String buildTvScript() {
        String css = readAsset("tv.css");
        String js = readAsset("tv.js");
        // The stylesheet travels as a JS string; JSON-style escaping keeps quotes and newlines intact.
        StringBuilder q = new StringBuilder("\"");
        for (char c : css.toCharArray()) {
            switch (c) {
                case '\\': q.append("\\\\"); break;
                case '"': q.append("\\\""); break;
                case '\n': q.append("\\n"); break;
                case '\r': break;
                default: q.append(c);
            }
        }
        q.append('"');
        return "window.__TV_CSS=" + q + ";\n" + js;
    }

    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (IOException e) {
            return "";
        }
    }

    private void inject(WebView view) {
        view.evaluateJavascript(tvScript, null);
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    // ---------------------------------------------------------------- keys

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        boolean down = event.getAction() == KeyEvent.ACTION_DOWN;

        if (code == KeyEvent.KEYCODE_BACK || code == KeyEvent.KEYCODE_ESCAPE) {
            if (!down && event.getRepeatCount() == 0) onBackKey();
            return true;
        }

        if (code == KeyEvent.KEYCODE_MENU || code == KeyEvent.KEYCODE_SETTINGS) {
            if (!down && event.getRepeatCount() == 0 && popup == null) showMenu();
            return true;
        }

        String media = mediaCommand(code);
        if (media != null) {
            if (down && popup == null) web.evaluateJavascript("window.__tv&&__tv.media('" + media + "')", null);
            return true;
        }

        if (errorView.getVisibility() == View.VISIBLE && !errorView.hasFocus()) errorView.requestFocus();
        return super.dispatchKeyEvent(event);
    }

    /** Menu key: continue watching, home, reload, site address. */
    private void showMenu() {
        final String last = prefs.getString("last", null);
        final String lastTitle = prefs.getString("lastTitle", "");
        final java.util.List<String> items = new java.util.ArrayList<>();
        if (last != null) items.add("▶ Продолжить: " + (lastTitle == null || lastTitle.isEmpty() ? last : lastTitle));
        items.add("Главная сайта");
        items.add("Обновить страницу");
        items.add("Адрес сайта: " + Uri.parse(site()).getHost());
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle("Яндекс Музыка TV")
                .setItems(items.toArray(new String[0]), (d, which) -> {
                    String item = items.get(which);
                    if (item.startsWith("▶")) web.loadUrl(last);
                    else if (item.startsWith("Главная")) web.loadUrl(site());
                    else if (item.startsWith("Обновить")) web.reload();
                    else askSite();
                }).show();
    }

    private void askSite() {
        final EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setText(site());
        input.setSelection(input.getText().length());
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle("Адрес сайта")
                .setMessage("Если сайт переехал на другой адрес, впишите новый. Например: https://music.yandex.ru/")
                .setView(input)
                .setPositiveButton("Сохранить", (d, w) -> {
                    String v = input.getText().toString().trim();
                    if (v.isEmpty()) v = DEFAULT_SITE;
                    if (!v.startsWith("http")) v = "https://" + v;
                    prefs.edit().putString("site", v).apply();
                    web.loadUrl(site());
                })
                .setNeutralButton("По умолчанию", (d, w) -> {
                    prefs.edit().remove("site").apply();
                    web.loadUrl(site());
                })
                .setNegativeButton("Отмена", null)
                .show();
    }

    private static String mediaCommand(int code) {
        switch (code) {
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_HEADSETHOOK: return "playpause";
            case KeyEvent.KEYCODE_MEDIA_PLAY: return "play";
            case KeyEvent.KEYCODE_MEDIA_PAUSE: return "pause";
            case KeyEvent.KEYCODE_MEDIA_STOP: return "pause";
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD: return "forward";
            case KeyEvent.KEYCODE_MEDIA_REWIND: return "rewind";
            case KeyEvent.KEYCODE_MEDIA_NEXT: return "next";
            case KeyEvent.KEYCODE_MEDIA_PREVIOUS: return "previous";
            default: return null;
        }
    }

    private void onBackKey() {
        if (popup != null) {
            closePopup();
            return;
        }
        if (customView != null) {
            web.evaluateJavascript("document.exitFullscreen&&document.fullscreenElement&&document.exitFullscreen()", null);
            hideCustomView();
            return;
        }
        if (errorView.getVisibility() == View.VISIBLE) {
            finish();
            return;
        }
        // The page decides first: leave the player's menu, close a dialog, leave the player.
        web.evaluateJavascript("window.__tv?__tv.back():false", value -> {
            if ("true".equals(value)) return;
            if (web.canGoBack()) {
                web.goBack();
                return;
            }
            long now = System.currentTimeMillis();
            if (now - lastBackAt < 2500) {
                finish();
            } else {
                lastBackAt = now;
                Toast.makeText(this, R.string.press_back_again, Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ---------------------------------------------------------------- full screen video

    private void hideCustomView() {
        if (customView == null) return;
        root.removeView(customView);
        customView = null;
        if (customViewCallback != null) customViewCallback.onCustomViewHidden();
        customViewCallback = null;
        web.setVisibility(View.VISIBLE);
        web.requestFocus();
    }

    // ---------------------------------------------------------------- sign-in popups

    /** Runs after the current callback returns (never destroy a WebView inside its own callback). */
    private void ui(Runnable r) {
        root.post(r);
    }

    private void closePopup() {
        if (popup == null) return;
        root.removeView(popup);
        popup.destroy();
        popup = null;
        web.requestFocus();
        web.reload();   // pick up the session the popup just created
    }

    // ---------------------------------------------------------------- lifecycle

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        // no web.onPause(): music keeps playing while you are on the home screen or in another app
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (popup != null) popup.destroy();
        root.removeView(web);
        web.destroy();
        super.onDestroy();
    }

    // ---------------------------------------------------------------- clients

    private class MainClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String scheme = request.getUrl().getScheme();
            // app links like tg:// or intent:// have nowhere to go
            if (scheme == null || !(scheme.equals("http") || scheme.equals("https"))) return true;
            // the site and sign-in pages stay in the app; ads and redirects to other sites are not opened
            if (request.isForMainFrame() && !isAllowedHost(request.getUrl().getHost())) {
                Toast.makeText(MainActivity.this, "Внешняя ссылка не открыта", Toast.LENGTH_SHORT).show();
                return true;
            }
            return false;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            progress.setVisibility(View.VISIBLE);
            errorView.setVisibility(View.GONE);
        }

        @Override
        public void onPageCommitVisible(WebView view, String url) {
            inject(view);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progress.setVisibility(View.GONE);
            inject(view);
            CookieManager.getInstance().flush();
            if (url != null && url.contains("episode-") && isSiteHost(Uri.parse(url).getHost())) {
                prefs.edit().putString("last", url).putString("lastTitle", view.getTitle()).apply();
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                errorView.setVisibility(View.VISIBLE);
                errorView.requestFocus();
            }
        }
    }

    private class MainChrome extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progress.setProgress(newProgress);
        }

        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (customView != null) {
                callback.onCustomViewHidden();
                return;
            }
            customView = view;
            customViewCallback = callback;
            customView.setBackgroundColor(Color.BLACK);
            root.addView(customView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
            customView.setKeepScreenOn(true);
        }

        @Override
        public void onHideCustomView() {
            hideCustomView();
        }

        @Override
        public Bitmap getDefaultVideoPoster() {
            // Without this, WebView paints a grey play icon over every <video> before it starts.
            return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            Uri origin = request.getOrigin();
            boolean ours = origin != null && origin.getHost() != null && isSiteHost(origin.getHost());
            boolean onlyDrm = true;
            for (String r : request.getResources()) {
                if (!PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID.equals(r)) onlyDrm = false;
            }
            if (ours && onlyDrm) request.grant(request.getResources());
            else request.deny();
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            if (popup != null) closePopup();
            popup = new WebView(MainActivity.this);
            configure(popup);
            CookieManager.getInstance().setAcceptThirdPartyCookies(popup, true);
            popup.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageStarted(WebView v, String url, Bitmap favicon) {
                    // a popup is only for signing in: anything else (ads) is closed at once
                    if (url != null && url.startsWith("http") && !isAllowedHost(Uri.parse(url).getHost())) {
                        ui(() -> closePopup());
                    }
                }

                @Override
                public void onPageFinished(WebView v, String url) {
                    inject(v);
                }
            });
            popup.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onCloseWindow(WebView window) {
                    closePopup();
                }
            });
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT);
            lp.setMargins(dp(80), dp(40), dp(80), dp(40));
            root.addView(popup, lp);
            popup.requestFocus();
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(popup);
            resultMsg.sendToTarget();
            return true;
        }
    }

    /** Called from tv.js. Everything here is harmless whichever page calls it. */
    private class Bridge {
        @JavascriptInterface
        public void setPlaying(boolean playing) {
            runOnUiThread(() -> {
                if (playing) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }
}
