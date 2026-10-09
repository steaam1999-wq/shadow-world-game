package com.komeeta.app;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.RenderEffect;
import android.graphics.Shader;
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
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.graphics.drawable.RoundedBitmapDrawable;
import androidx.core.graphics.drawable.RoundedBitmapDrawableFactory;

import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;

/** Экран входящего звонка поверх блокировки: фото и имя, «Принять» и «Отклонить», рингтон и вибрация. */
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
        setContentView(buildUi(name == null ? "Komeeta" : name, video, getIntent().getStringExtra("avatar")));
        startRinging();
        handler.postDelayed(this::finishCall, CallNotifier.RING_MS);
    }

    private float dp;

    private int px(float v) { return (int) (v * dp); }

    private View buildUi(String name, boolean video, String avatarUrl) {
        dp = getResources().getDisplayMetrics().density;
        FrameLayout root = new FrameLayout(this);
        root.setBackground(new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[]{0xFF4A1F6B, 0xFF2A1240, 0xFF0D0716}));

        // Фон — размытое фото звонящего (появится, когда загрузится)
        ImageView backdrop = new ImageView(this);
        backdrop.setScaleType(ImageView.ScaleType.CENTER_CROP);
        backdrop.setAlpha(0f);
        root.addView(backdrop, new FrameLayout.LayoutParams(-1, -1));
        View shade = new View(this);
        shade.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{0x66000000, 0x33000000, 0xCC000000, 0xF2000000}));
        root.addView(shade, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setGravity(Gravity.CENTER_HORIZONTAL);
        col.setPadding(px(24), px(64), px(24), 0);

        // Плашка «Видеозвонок · Komeeta»
        LinearLayout chip = new LinearLayout(this);
        chip.setOrientation(LinearLayout.HORIZONTAL);
        chip.setGravity(Gravity.CENTER_VERTICAL);
        chip.setPadding(px(14), px(7), px(16), px(7));
        GradientDrawable chipBg = new GradientDrawable();
        chipBg.setCornerRadius(px(100));
        chipBg.setColor(0x26FFFFFF);
        chipBg.setStroke(px(1), 0x33FFFFFF);
        chip.setBackground(chipBg);
        ImageView chipIcon = new ImageView(this);
        chipIcon.setImageResource(video ? R.drawable.ic_videocam : R.drawable.ic_call);
        chip.addView(chipIcon, new LinearLayout.LayoutParams(px(16), px(16)));
        TextView chipText = new TextView(this);
        chipText.setText(video ? "Видеозвонок · Komeeta" : "Аудиозвонок · Komeeta");
        chipText.setTextColor(0xE6FFFFFF);
        chipText.setTextSize(13);
        chipText.setLetterSpacing(0.02f);
        LinearLayout.LayoutParams ctp = new LinearLayout.LayoutParams(-2, -2);
        ctp.leftMargin = px(8);
        chip.addView(chipText, ctp);
        col.addView(chip, new LinearLayout.LayoutParams(-2, -2));

        // Аватар с «пульсирующими» кольцами
        FrameLayout stage = new FrameLayout(this);
        for (int i = 0; i < 2; i++) {
            View ring = new View(this);
            GradientDrawable rg = new GradientDrawable();
            rg.setShape(GradientDrawable.OVAL);
            rg.setColor(0x22FF4F86);
            rg.setStroke(px(2), 0x55FF8FB3);
            ring.setBackground(rg);
            stage.addView(ring, new FrameLayout.LayoutParams(px(150), px(150), Gravity.CENTER));
            pulse(ring, i * 1100L);
        }
        FrameLayout avatarBox = new FrameLayout(this);
        GradientDrawable border = new GradientDrawable(GradientDrawable.Orientation.BL_TR, new int[]{0xFFFFB347, 0xFFFF4F86, 0xFF8A5CFF});
        border.setShape(GradientDrawable.OVAL);
        avatarBox.setBackground(border);
        avatarBox.setPadding(px(4), px(4), px(4), px(4));
        if (Build.VERSION.SDK_INT >= 21) avatarBox.setElevation(px(12));
        TextView letter = new TextView(this);
        letter.setText(name.isEmpty() ? "K" : name.substring(0, 1).toUpperCase());
        letter.setTextColor(Color.WHITE);
        letter.setTextSize(56);
        letter.setTypeface(Typeface.create("sans-serif-medium", Typeface.BOLD));
        letter.setGravity(Gravity.CENTER);
        GradientDrawable inner = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[]{0xFFFF6FA0, 0xFF9B5CFF});
        inner.setShape(GradientDrawable.OVAL);
        letter.setBackground(inner);
        avatarBox.addView(letter, new FrameLayout.LayoutParams(-1, -1));
        ImageView photo = new ImageView(this);
        avatarBox.addView(photo, new FrameLayout.LayoutParams(-1, -1));
        stage.addView(avatarBox, new FrameLayout.LayoutParams(px(150), px(150), Gravity.CENTER));
        LinearLayout.LayoutParams stp = new LinearLayout.LayoutParams(px(260), px(260));
        stp.topMargin = px(40);
        col.addView(stage, stp);

        TextView title = new TextView(this);
        title.setText(name);
        title.setTextColor(Color.WHITE);
        title.setTextSize(32);
        title.setTypeface(Typeface.create("sans-serif-medium", Typeface.BOLD));
        title.setGravity(Gravity.CENTER);
        title.setMaxLines(2);
        title.setShadowLayer(px(8), 0, px(2), 0x66000000);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(-2, -2);
        tp.topMargin = px(12);
        col.addView(title, tp);

        TextView sub = new TextView(this);
        sub.setText("звонит вам…");
        sub.setTextColor(0xB3FFFFFF);
        sub.setTextSize(16);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-2, -2);
        sp.topMargin = px(6);
        col.addView(sub, sp);
        root.addView(col, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER);
        row.addView(roundButton("Отклонить", R.drawable.ic_call_end, new int[]{0xFFFF6B6B, 0xFFE5304A}, 0x66E5304A, false, v -> decline()), new LinearLayout.LayoutParams(0, -2, 1));
        row.addView(roundButton("Принять", video ? R.drawable.ic_videocam : R.drawable.ic_call, new int[]{0xFF4ADE80, 0xFF16A34A}, 0x6616A34A, true, v -> answer()), new LinearLayout.LayoutParams(0, -2, 1));
        FrameLayout.LayoutParams rp = new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM);
        rp.bottomMargin = px(64);
        root.addView(row, rp);

        if (avatarUrl != null && avatarUrl.startsWith("https://")) loadAvatar(avatarUrl, photo, backdrop);
        return root;
    }

    /** Кольцо расходится от аватара и тает — как в мессенджерах. */
    private void pulse(View ring, long delay) {
        ring.setAlpha(0f);
        AnimatorSet set = new AnimatorSet();
        ObjectAnimator sx = ObjectAnimator.ofFloat(ring, View.SCALE_X, 1f, 1.7f);
        ObjectAnimator sy = ObjectAnimator.ofFloat(ring, View.SCALE_Y, 1f, 1.7f);
        ObjectAnimator al = ObjectAnimator.ofFloat(ring, View.ALPHA, 0.9f, 0f);
        for (ObjectAnimator o : new ObjectAnimator[]{sx, sy, al}) { o.setRepeatCount(ValueAnimator.INFINITE); o.setDuration(2200); }
        set.playTogether(sx, sy, al);
        set.setInterpolator(new DecelerateInterpolator());
        set.setStartDelay(delay);
        set.start();
    }

    /** Фото звонящего: круг в центре и размытый фон. */
    private void loadAvatar(String url, ImageView photo, ImageView backdrop) {
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(6000);
                c.setReadTimeout(8000);
                Bitmap bmp;
                try (InputStream in = c.getInputStream()) { bmp = BitmapFactory.decodeStream(in); }
                if (bmp == null) return;
                int side = Math.min(bmp.getWidth(), bmp.getHeight());
                Bitmap square = Bitmap.createBitmap(bmp, (bmp.getWidth() - side) / 2, (bmp.getHeight() - side) / 2, side, side);
                RoundedBitmapDrawable round = RoundedBitmapDrawableFactory.create(getResources(), square);
                round.setCircular(true);
                runOnUiThread(() -> {
                    if (isFinishing()) return;
                    photo.setImageDrawable(round);
                    photo.setAlpha(0f);
                    photo.animate().alpha(1f).setDuration(250).start();
                    backdrop.setImageBitmap(bmp);
                    if (Build.VERSION.SDK_INT >= 31) {
                        backdrop.setRenderEffect(RenderEffect.createBlurEffect(px(40), px(40), Shader.TileMode.CLAMP));
                        backdrop.animate().alpha(0.85f).setDuration(400).start();
                    } else backdrop.animate().alpha(0.35f).setDuration(400).start();
                });
            } catch (Exception ignored) { /* нет сети — остаётся буква */ }
        }).start();
    }

    private View roundButton(String label, int icon, int[] colors, int glow, boolean bounce, View.OnClickListener click) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);

        FrameLayout btn = new FrameLayout(this);
        // Мягкое свечение под кнопкой
        View halo = new View(this);
        GradientDrawable h = new GradientDrawable();
        h.setShape(GradientDrawable.OVAL);
        h.setColor(glow);
        halo.setBackground(h);
        btn.addView(halo, new FrameLayout.LayoutParams(px(96), px(96), Gravity.CENTER));
        ImageView face = new ImageView(this);
        GradientDrawable c = new GradientDrawable(GradientDrawable.Orientation.TL_BR, colors);
        c.setShape(GradientDrawable.OVAL);
        face.setBackground(c);
        face.setImageResource(icon);
        face.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        face.setPadding(px(22), px(22), px(22), px(22));
        if (Build.VERSION.SDK_INT >= 21) face.setElevation(px(8));
        btn.addView(face, new FrameLayout.LayoutParams(px(76), px(76), Gravity.CENTER));
        btn.setOnClickListener(click);
        btn.setOnTouchListener((v, e) -> {
            if (e.getAction() == MotionEvent.ACTION_DOWN) face.animate().scaleX(0.9f).scaleY(0.9f).setDuration(90).start();
            else if (e.getAction() == MotionEvent.ACTION_UP || e.getAction() == MotionEvent.ACTION_CANCEL) face.animate().scaleX(1f).scaleY(1f).setDuration(120).start();
            return false;
        });
        box.addView(btn, new LinearLayout.LayoutParams(px(96), px(96)));

        if (bounce) {
            // «Принять» мягко подпрыгивает и покачивает трубкой
            ObjectAnimator up = ObjectAnimator.ofFloat(face, View.TRANSLATION_Y, 0f, -px(8), 0f);
            up.setDuration(1200);
            up.setRepeatCount(ValueAnimator.INFINITE);
            up.setInterpolator(new AccelerateDecelerateInterpolator());
            up.start();
            ObjectAnimator glowPulse = ObjectAnimator.ofFloat(halo, View.ALPHA, 1f, 0.3f, 1f);
            glowPulse.setDuration(1200);
            glowPulse.setRepeatCount(ValueAnimator.INFINITE);
            glowPulse.start();
        }

        TextView t = new TextView(this);
        t.setText(label);
        t.setTextColor(0xE6FFFFFF);
        t.setTextSize(14);
        t.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
        lp.topMargin = px(6);
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
