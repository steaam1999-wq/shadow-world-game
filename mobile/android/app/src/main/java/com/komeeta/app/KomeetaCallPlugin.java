package com.komeeta.app;

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
}
