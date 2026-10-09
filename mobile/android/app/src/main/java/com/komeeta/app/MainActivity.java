package com.komeeta.app;

import android.app.NotificationManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Komeeta: своё окно с komeeta.com (WebView) — Chrome не нужен.
 * Передаёт сайту «принять звонок» / «отклонить» с экрана вызова (событие komeeta-call).
 */
public class MainActivity extends BridgeActivity {
    static volatile String declined = null;
    /** Приложение на экране — звонок покажет сам сайт, экран вызова поверх не нужен. */
    static volatile boolean visible = false;
    private String pendingAnswer = null;
    private boolean pageReady = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Channels.ensure(this);
        WebSettings s = getBridge().getWebView().getSettings();
        // Звук собеседника и рингтон в звонках начинаются без лишнего нажатия
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " KomeetaApp/2");
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                pageReady = true;
                deliver();
            }
        });
        take(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        take(intent);
        deliver();
    }

    @Override
    public void onResume() {
        super.onResume();
        visible = true;
        deliver();
        askFullScreenOnce();
    }

    @Override
    public void onPause() {
        visible = false;
        super.onPause();
    }

    private void take(Intent i) {
        if (i == null) return;
        String c = i.getStringExtra("answerCall");
        if (c != null) { pendingAnswer = c; i.removeExtra("answerCall"); }
    }

    /** Сообщаем сайту: принять звонок или отказ, сделанный с экрана блокировки. */
    private void deliver() {
        if (!pageReady) return;
        WebView w = getBridge().getWebView();
        if (pendingAnswer != null) {
            String c = pendingAnswer.replaceAll("[^a-zA-Z0-9-]", "");
            pendingAnswer = null;
            w.post(() -> w.evaluateJavascript("window.__komeetaCall={action:'answer',call:'" + c + "'};window.dispatchEvent(new Event('komeeta-call'))", null));
        }
        if (declined != null) {
            String c = declined.replaceAll("[^a-zA-Z0-9-]", "");
            declined = null;
            w.post(() -> w.evaluateJavascript("window.__komeetaCall={action:'decline',call:'" + c + "'};window.dispatchEvent(new Event('komeeta-call'))", null));
        }
    }

    /** Android 14+: разрешение показывать звонок на весь экран поверх блокировки — спрашиваем один раз. */
    private void askFullScreenOnce() {
        if (Build.VERSION.SDK_INT < 34) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null || nm.canUseFullScreenIntent()) return;
        SharedPreferences p = getSharedPreferences("komeeta", MODE_PRIVATE);
        if (p.getBoolean("askedFullScreen", false)) return;
        p.edit().putBoolean("askedFullScreen", true).apply();
        try {
            startActivity(new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + getPackageName())));
        } catch (Exception ignored) { }
    }
}
