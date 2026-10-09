package com.komeeta.app;

import androidx.annotation.NonNull;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/** Push от Komeeta: звонки показываем сами (экран вызова), остальное — как обычно через плагин. */
public class KomeetaMessagingService extends MessagingService {
    @Override
    public void onMessageReceived(@NonNull RemoteMessage msg) {
        Map<String, String> d = msg.getData();
        String kind = d.get("kind");
        if ("call".equals(kind)) { if (!MainActivity.visible) CallNotifier.show(this, d); return; }
        if ("call_end".equals(kind)) { CallNotifier.cancel(this, d.get("call")); return; }
        super.onMessageReceived(msg);
    }
}
