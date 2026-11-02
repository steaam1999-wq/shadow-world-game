package com.twosub.tv;

import android.annotation.SuppressLint;
import android.app.Activity;
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
 * 2sub.movie in a full-screen WebView, made usable with a TV remote.
 *
 * The page itself does all the work (catalogue, account, player, interactive subtitles); this activity only
 * hosts it and adds the TV layer: assets/tv.js (D-pad navigation, player keys) and assets/tv.css (focus ring).
 */
public class MainActivity extends Activity {

    static final String HOME = "https://2sub.movie/";

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

    private static String startUrl(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        if (data != null && data.getHost() != null && data.getHost().endsWith("2sub.movie")) {
            return data.toString();
        }
        return HOME;
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

        String media = mediaCommand(code);
        if (media != null) {
            if (down && popup == null) web.evaluateJavascript("window.__tv&&__tv.media('" + media + "')", null);
            return true;
        }

        if (errorView.getVisibility() == View.VISIBLE && !errorView.hasFocus()) errorView.requestFocus();
        return super.dispatchKeyEvent(event);
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
        web.onPause();
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
            // http(s) stays in the app (site, sign-in pages); app links like tg:// or intent:// have nowhere to go.
            return scheme == null || !(scheme.equals("http") || scheme.equals("https"));
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
            boolean ours = origin != null && origin.getHost() != null && origin.getHost().endsWith("2sub.movie");
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
