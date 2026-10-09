package com.komeeta.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.lang.ref.WeakReference;

/** Экран входящего звонка поверх блокировки: имя, «Принять» и «Отклонить», рингтон и вибрация. */
public class IncomingCallActivity extends Activity {
    private static WeakReference<IncomingCallActivity> current = new WeakReference<>(null);
    private Ringtone ringtone;
    private Vibrator vibrator;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private String call;

    static void closeAll() {
        IncomingCallActivity a = current.get();
        if (a != null) a.runOnUiThread(a::finishCall);
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        current = new WeakReference<>(this);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        call = getIntent().getStringExtra("call");
        String name = getIntent().getStringExtra("name");
        boolean video = getIntent().getBooleanExtra("video", false);
        if (call == null || !call.equals(CallNotifier.currentCall)) { finish(); return; }
        setContentView(buildUi(name == null ? "Komeeta" : name, video));
        startRinging();
        handler.postDelayed(this::finishCall, CallNotifier.RING_MS);
    }

    private View buildUi(String name, boolean video) {
        float dp = getResources().getDisplayMetrics().density;
        FrameLayout root = new FrameLayout(this);
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{0xFF3B1D4E, 0xFF120A1C});
        root.setBackground(bg);

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setGravity(Gravity.CENTER_HORIZONTAL);
        col.setPadding(0, (int) (120 * dp), 0, 0);

        TextView avatar = new TextView(this);
        avatar.setText(name.isEmpty() ? "K" : name.substring(0, 1).toUpperCase());
        avatar.setTextColor(Color.WHITE);
        avatar.setTextSize(48);
        avatar.setTypeface(Typeface.DEFAULT_BOLD);
        avatar.setGravity(Gravity.CENTER);
        GradientDrawable circle = new GradientDrawable(GradientDrawable.Orientation.BL_TR, new int[]{0xFFFFB347, 0xFFFF4F86, 0xFF8A5CFF});
        circle.setShape(GradientDrawable.OVAL);
        avatar.setBackground(circle);
        col.addView(avatar, new LinearLayout.LayoutParams((int) (120 * dp), (int) (120 * dp)));

        TextView title = new TextView(this);
        title.setText(name);
        title.setTextColor(Color.WHITE);
        title.setTextSize(30);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(-2, -2);
        tp.topMargin = (int) (24 * dp);
        col.addView(title, tp);

        TextView sub = new TextView(this);
        sub.setText(video ? "Видеозвонок Komeeta…" : "Звонок Komeeta…");
        sub.setTextColor(0xBFFFFFFF);
        sub.setTextSize(16);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-2, -2);
        sp.topMargin = (int) (8 * dp);
        col.addView(sub, sp);
        root.addView(col, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER);
        row.addView(roundButton("Отклонить", 0xFFEF4444, v -> decline()), new LinearLayout.LayoutParams(0, -2, 1));
        row.addView(roundButton("Принять", 0xFF22C55E, v -> answer()), new LinearLayout.LayoutParams(0, -2, 1));
        FrameLayout.LayoutParams rp = new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM);
        rp.bottomMargin = (int) (72 * dp);
        root.addView(row, rp);
        return root;
    }

    private View roundButton(String label, int color, View.OnClickListener click) {
        float dp = getResources().getDisplayMetrics().density;
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);
        TextView btn = new TextView(this);
        btn.setText(color == 0xFF22C55E ? "✆" : "✕");
        btn.setTextColor(Color.WHITE);
        btn.setTextSize(30);
        btn.setGravity(Gravity.CENTER);
        GradientDrawable c = new GradientDrawable();
        c.setShape(GradientDrawable.OVAL);
        c.setColor(color);
        btn.setBackground(c);
        btn.setOnClickListener(click);
        box.addView(btn, new LinearLayout.LayoutParams((int) (76 * dp), (int) (76 * dp)));
        TextView t = new TextView(this);
        t.setText(label);
        t.setTextColor(Color.WHITE);
        t.setTextSize(14);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
        lp.topMargin = (int) (10 * dp);
        box.addView(t, lp);
        return box;
    }

    private void startRinging() {
        try {
            ringtone = RingtoneManager.getRingtone(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE));
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= 28) ringtone.setLooping(true);
                ringtone.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build());
                ringtone.play();
            }
        } catch (Exception ignored) { }
        try {
            vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            long[] p = {0, 800, 600};
            if (vibrator != null) {
                if (Build.VERSION.SDK_INT >= 26) vibrator.vibrate(VibrationEffect.createWaveform(p, 0));
                else vibrator.vibrate(p, 0);
            }
        } catch (Exception ignored) { }
    }

    private void stopRinging() {
        try { if (ringtone != null) ringtone.stop(); } catch (Exception ignored) { }
        try { if (vibrator != null) vibrator.cancel(); } catch (Exception ignored) { }
    }

    private void answer() {
        stopRinging();
        String c = call;
        CallNotifier.cancel(this, c);
        // Снять блокировку (если есть пароль — система попросит его), затем открыть звонок в приложении.
        KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        Runnable open = () -> { startActivity(CallNotifier.answerIntent(this, c)); finish(); };
        if (km != null && km.isKeyguardLocked() && Build.VERSION.SDK_INT >= 26) {
            km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override public void onDismissSucceeded() { open.run(); }
                @Override public void onDismissCancelled() { open.run(); }
                @Override public void onDismissError() { open.run(); }
            });
        } else open.run();
    }

    private void decline() {
        MainActivity.declined = call;
        CallNotifier.cancel(this, call);
        finishCall();
    }

    private void finishCall() {
        stopRinging();
        handler.removeCallbacksAndMessages(null);
        if (!isFinishing()) finish();
    }

    @Override
    protected void onDestroy() {
        stopRinging();
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Override
    public void onBackPressed() { /* не закрывать вызов кнопкой «назад» */ }
}
