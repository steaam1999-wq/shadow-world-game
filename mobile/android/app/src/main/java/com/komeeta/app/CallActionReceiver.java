package com.komeeta.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** «Отклонить» из уведомления: убрать вызов; отказ уйдёт собеседнику при следующем открытии приложения. */
public class CallActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent i) {
        String call = i.getStringExtra("call");
        MainActivity.declined = call;
        CallNotifier.cancel(ctx, call);
    }
}
