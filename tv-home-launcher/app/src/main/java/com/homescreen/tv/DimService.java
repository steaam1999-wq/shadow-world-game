package com.homescreen.tv;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;

/**
 * Dims the whole TV picture, over every app, with a black layer of adjustable opacity drawn "over other
 * apps". It never takes focus or input, so remotes and apps behave as usual. It runs as a foreground
 * service so the layer stays while the home screen is in the background.
 */
public class DimService extends Service {

    static final String EXTRA_BRIGHTNESS = "brightness";
    /** Android lets an overlay obscure at most 80 %; 20 % brightness is our minimum anyway. */
    static final float MAX_DIM = 0.8f;
    private static final int TYPE_SPECIAL_USE = 0x40000000;   // ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE

    private View layer;

    static boolean canDimEverywhere(Context c) {
        return Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(c);
    }

    /** Applies the brightness (20…100) to the whole screen; 100 removes the layer and stops the service. */
    static void apply(Context c, int brightness) {
        Intent i = new Intent(c, DimService.class).putExtra(EXTRA_BRIGHTNESS, brightness);
        if (brightness >= 100) {
            c.stopService(i);
        } else if (Build.VERSION.SDK_INT >= 26) {
            c.startForegroundService(i);
        } else {
            c.startService(i);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        goForeground();
        int b = intent != null ? intent.getIntExtra(EXTRA_BRIGHTNESS, 100)
                : getSharedPreferences("home", MODE_PRIVATE).getInt("brightness", 100);
        if (b >= 100 || !canDimEverywhere(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        show(Math.min(MAX_DIM, 1f - b / 100f));
        return START_STICKY;   // if the system ever kills it, it comes back with the saved brightness
    }

    private void goForeground() {
        Notification.Builder nb;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            NotificationChannel ch = new NotificationChannel("dim", "Яркость экрана", NotificationManager.IMPORTANCE_MIN);
            nm.createNotificationChannel(ch);
            nb = new Notification.Builder(this, "dim");
        } else {
            nb = new Notification.Builder(this);
        }
        Notification n = nb.setSmallIcon(R.drawable.ic_brightness)
                .setContentTitle("Яркость экрана уменьшена")
                .setOngoing(true)
                .build();
        if (Build.VERSION.SDK_INT >= 34) startForeground(1, n, TYPE_SPECIAL_USE);
        else startForeground(1, n);
    }

    private void show(float alpha) {
        WindowManager wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (layer == null) {
            layer = new View(this);
            layer.setBackgroundColor(Color.BLACK);
            int type = Build.VERSION.SDK_INT >= 26 ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE;
            WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT, type,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                            | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                            | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    PixelFormat.TRANSLUCENT);
            lp.alpha = alpha;
            try {
                wm.addView(layer, lp);
            } catch (RuntimeException e) {   // permission withdrawn meanwhile
                layer = null;
                stopSelf();
            }
            return;
        }
        WindowManager.LayoutParams lp = (WindowManager.LayoutParams) layer.getLayoutParams();
        lp.alpha = alpha;
        wm.updateViewLayout(layer, lp);
    }

    @Override
    public void onDestroy() {
        if (layer != null) {
            try {
                ((WindowManager) getSystemService(WINDOW_SERVICE)).removeView(layer);
            } catch (RuntimeException ignored) {
                // already gone
            }
            layer = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
