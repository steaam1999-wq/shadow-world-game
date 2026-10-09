package com.komeeta.app;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.util.Map;

/** Входящий звонок: уведомление с полноэкранным экраном вызова поверх блокировки. */
final class CallNotifier {
    static final int ID = 7001;
    static final long RING_MS = 45_000;
    static volatile String currentCall = null;

    static void show(Context ctx, Map<String, String> d) {
        Channels.ensure(ctx);
        String call = d.get("call");
        if (call == null) return;
        currentCall = call;
        String name = d.containsKey("name") ? d.get("name") : "Komeeta";
        boolean video = "1".equals(d.get("video"));

        Intent screen = new Intent(ctx, IncomingCallActivity.class)
                .putExtra("call", call).putExtra("name", name).putExtra("video", video)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent full = PendingIntent.getActivity(ctx, 1, screen, f);
        PendingIntent answer = PendingIntent.getActivity(ctx, 2, answerIntent(ctx, call), f);
        PendingIntent decline = PendingIntent.getBroadcast(ctx, 3, new Intent(ctx, CallActionReceiver.class).setAction("decline").putExtra("call", call), f);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, Channels.CALLS)
                .setSmallIcon(R.drawable.ic_notification)
                .setColor(0xFFFF4F86)
                .setContentTitle(video ? "🎥 Видеозвонок" : "📞 Входящий звонок")
                .setContentText(name + " звонит вам")
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(true)
                .setTimeoutAfter(RING_MS)
                .setContentIntent(full)
                .setFullScreenIntent(full, true)
                .addAction(0, "Отклонить", decline)
                .addAction(0, "Принять", answer);
        try { NotificationManagerCompat.from(ctx).notify(ID, b.build()); } catch (SecurityException ignored) { /* нет разрешения на уведомления */ }
    }

    static Intent answerIntent(Context ctx, String call) {
        return new Intent(ctx, MainActivity.class).putExtra("answerCall", call)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    }

    static void cancel(Context ctx, String call) {
        if (call != null && currentCall != null && !call.equals(currentCall)) return;
        currentCall = null;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(ID);
        IncomingCallActivity.closeAll();
    }

    private CallNotifier() {}
}
