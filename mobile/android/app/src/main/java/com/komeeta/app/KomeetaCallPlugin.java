package com.komeeta.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Сайт сообщает приложению, что звонок закончился: окно снова прячется за экраном блокировки. */
@CapacitorPlugin(name = "KomeetaCall")
public class KomeetaCallPlugin extends Plugin {
    @PluginMethod
    public void ended(PluginCall call) {
        if (getActivity() instanceof MainActivity) getActivity().runOnUiThread(() -> ((MainActivity) getActivity()).overLockScreen(false));
        call.resolve();
    }
}
