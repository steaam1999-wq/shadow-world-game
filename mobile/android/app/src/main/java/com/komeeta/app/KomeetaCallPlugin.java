package com.komeeta.app;

import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Сайт сообщает приложению о звонке: закончился (окно снова за блокировкой) и идёт ли видеозвонок (для мини-окна). */
@CapacitorPlugin(name = "KomeetaCall")
public class KomeetaCallPlugin extends Plugin {
    @PluginMethod
    public void ended(PluginCall call) {
        if (getActivity() instanceof MainActivity) getActivity().runOnUiThread(() -> ((MainActivity) getActivity()).overLockScreen(false));
        call.resolve();
    }

    /** Идёт видеозвонок — при сворачивании приложения разговор продолжится в маленьком окне. */
    @PluginMethod
    public void videoCall(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        if (getActivity() instanceof MainActivity) getActivity().runOnUiThread(() -> ((MainActivity) getActivity()).setVideoCall(on));
        call.resolve();
    }

    /** Открыть настройки уведомлений Komeeta (если их выключили — включить одним переходом). */
    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        String pkg = getContext().getPackageName();
        Intent i;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
        } else {
            i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
        } catch (Exception e) {
            // Некоторые оболочки не знают экран уведомлений — открываем общую страницу приложения.
            getContext().startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        call.resolve();
    }

    /** Ссылка из сообщения: системное окно «Открыть с помощью» — человек сам выбирает браузер. */
    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) {
            call.reject("bad url");
            return;
        }
        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE);
        Intent chooser = Intent.createChooser(view, "Открыть ссылку в…");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            // Сама Komeeta в списке не нужна: ссылку открываем наружу.
            chooser.putExtra(Intent.EXTRA_EXCLUDE_COMPONENTS, new ComponentName[] { new ComponentName(getContext(), MainActivity.class) });
        }
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("no browser");
        }
    }
}
