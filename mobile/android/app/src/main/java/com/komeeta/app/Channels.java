package com.komeeta.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;

/** Каналы уведомлений: «Звонки» (рингтон, поверх экрана) и «Сообщения». */
final class Channels {
    static final String CALLS = "calls_v2";
    static final String MESSAGES = "messages";

    static void ensure(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel calls = new NotificationChannel(CALLS, "Звонки", NotificationManager.IMPORTANCE_HIGH);
        calls.setDescription("Входящие звонки и видеозвонки");
        calls.enableVibration(true);
        calls.setVibrationPattern(new long[]{0, 800, 400, 800, 400, 800});
        calls.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        calls.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        calls.setBypassDnd(true);
        nm.createNotificationChannel(calls);

        NotificationChannel msgs = new NotificationChannel(MESSAGES, "Сообщения", NotificationManager.IMPORTANCE_HIGH);
        msgs.setDescription("Сообщения, подписки и напоминания о встречах");
        msgs.enableVibration(true);
        msgs.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        nm.createNotificationChannel(msgs);
        nm.deleteNotificationChannel("calls"); // старый канал без полноэкранного вызова
    }

    private Channels() {}
}
