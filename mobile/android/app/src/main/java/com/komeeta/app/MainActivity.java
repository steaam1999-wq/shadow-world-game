package com.komeeta.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

/**
 * Komeeta: своё окно с komeeta.com (WebView) — Chrome не нужен.
 * Каналы уведомлений: «Звонки» (рингтон, на весь экран поверх) и «Сообщения».
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createChannels();
        WebSettings s = getBridge().getWebView().getSettings();
        // Звук собеседника и рингтон в звонках начинаются без лишнего нажатия
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " KomeetaApp/2");
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel calls = new NotificationChannel("calls", "Звонки", NotificationManager.IMPORTANCE_HIGH);
        calls.setDescription("Входящие звонки и видеозвонки");
        calls.enableVibration(true);
        calls.setVibrationPattern(new long[]{0, 600, 300, 600, 300, 600});
        calls.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        Uri ring = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        calls.setSound(ring, new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        nm.createNotificationChannel(calls);

        NotificationChannel msgs = new NotificationChannel("messages", "Сообщения", NotificationManager.IMPORTANCE_HIGH);
        msgs.setDescription("Сообщения, подписки и напоминания о встречах");
        msgs.enableVibration(true);
        msgs.setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE);
        nm.createNotificationChannel(msgs);
    }
}
