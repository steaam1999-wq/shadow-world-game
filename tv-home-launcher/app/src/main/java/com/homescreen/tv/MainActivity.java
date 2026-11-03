package com.homescreen.tv;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.Typeface;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.TransitionDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.OvershootInterpolator;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * "Домашний экран": a native Android TV home screen.
 *
 * Plain framework views only, so every movement is done by the system's hardware renderer, like the TV's own
 * menus: a clock, a large title for the focused app, glass category tabs and a row of big 16:9 tiles showing
 * each app's own TV banner (or its icon on a colour card when it has no banner).
 */
public class MainActivity extends Activity {

    static final String YANDEX_BROWSER = "com.yandex.browser.tv";
    static final String WEB_PREFIX = "url:";

    /** Default «Главная» row, in order; only installed apps (and the website shortcuts) appear. */
    static final String[] DEFAULT_PINS = {
            "ru.kinopoisk.tv", "ru.kinopoisk", "com.google.android.youtube.tv", "ru.more.play", "ru.okko.tv",
            "ru.rt.video.app.tv", "ru.ivi.client", "ru.start.androidmobile", "ru.start.tv", "gpm.tnt_premier",
            "com.netflix.ninja", "url:https://jut-su.net/", "com.vk.tv", "com.vk.vkvideo", "ru.rutube.app.tv",
            "ru.rutube.app", "tv.twitch.android.viewer", "tv.twitch.android.app", "com.msx.msx",
            "ru.yandex.music", "com.spotify.tv.android", YANDEX_BROWSER, "com.android.vending", "org.amnezia.vpn"
    };

    static final String[][] CATEGORY_PREFIXES = {
            {"kino", "ru.kinopoisk", "ru.more.play", "ru.okko", "tv.okko", "ru.rt.video.app", "ru.ivi.", "ru.start.",
                    "gpm.", "com.netflix", "ru.kion", "ru.mts.", "com.amediateka", "url:https://jut-su"},
            {"video", "com.google.android.youtube", "com.vk.", "ru.rutube", "tv.twitch", "com.msx", "ru.vk.",
                    "com.liskovsoft", "org.xbmc", "com.plexapp", "ru.ntv", "ru.smotreshka"},
            {"music", "ru.yandex.music", "com.spotify", "ru.zvuk", "com.apple.android.music", "deezer",
                    "com.soundcloud"},
    };

    static final String[] TAB_KEYS = {"home", "kino", "video", "music", "all"};
    static final String[] TAB_NAMES = {"Главная", "Кино и сериалы", "Видео", "Музыка", "Все приложения"};

    static final Map<String, String> CATEGORY_TITLE = new HashMap<>();
    static {
        CATEGORY_TITLE.put("kino", "КИНО И СЕРИАЛЫ");
        CATEGORY_TITLE.put("video", "ВИДЕО");
        CATEGORY_TITLE.put("music", "МУЗЫКА");
        CATEGORY_TITLE.put("other", "ПРИЛОЖЕНИЯ");
    }

    static final Map<String, String> DESCRIPTIONS = new LinkedHashMap<>();
    static {
        DESCRIPTIONS.put("ru.kinopoisk", "Фильмы, сериалы и спорт. Оригинальные премьеры и подборки на вечер.");
        DESCRIPTIONS.put("com.google.android.youtube", "Видео, музыка и блогеры.");
        DESCRIPTIONS.put("ru.more.play", "Новинки кино, сериалы и прямые трансляции матчей.");
        DESCRIPTIONS.put("ru.okko", "Новинки кино, сериалы и прямые трансляции матчей.");
        DESCRIPTIONS.put("ru.rt.video.app", "Телеканалы, фильмы и сериалы в одной подписке.");
        DESCRIPTIONS.put("ru.ivi.", "Большой каталог кино и мультфильмов для всей семьи.");
        DESCRIPTIONS.put("ru.start.", "Российские сериалы и эксклюзивные проекты.");
        DESCRIPTIONS.put("gpm.", "Шоу, сериалы и премьеры телеканалов.");
        DESCRIPTIONS.put("com.netflix", "Сериалы и фильмы со всего мира.");
        DESCRIPTIONS.put("url:https://jut-su", "Аниме-сериалы и фильмы с озвучкой.");
        DESCRIPTIONS.put("com.vk.", "Шоу, клипы, сериалы и трансляции.");
        DESCRIPTIONS.put("ru.rutube", "Видео, ТВ-эфиры и передачи.");
        DESCRIPTIONS.put("tv.twitch", "Игровые стримы и прямые эфиры.");
        DESCRIPTIONS.put("com.msx", "Медиатека и плейлисты для телевизора.");
        DESCRIPTIONS.put("ru.yandex.music", "Моя волна, плейлисты и подкасты.");
        DESCRIPTIONS.put("com.spotify", "Музыка и подкасты.");
        DESCRIPTIONS.put(YANDEX_BROWSER, "Поиск и любые сайты.");
        DESCRIPTIONS.put("com.android.vending", "Приложения и игры для телевизора.");
        DESCRIPTIONS.put("org.amnezia.vpn", "Защищённое подключение.");
    }

    static final String[][] TV_SETTINGS = {
            {"Сеть и Интернет", Settings.ACTION_WIFI_SETTINGS},
            {"Аккаунты и вход", Settings.ACTION_SYNC_SETTINGS},
            {"Приложения", Settings.ACTION_APPLICATION_SETTINGS},
            {"Пульты и Bluetooth", Settings.ACTION_BLUETOOTH_SETTINGS},
            {"Входы (HDMI)", "inputs"},
            {"Дата и время", Settings.ACTION_DATE_SETTINGS},
            {"Язык", Settings.ACTION_LOCALE_SETTINGS},
            {"Клавиатура", Settings.ACTION_INPUT_METHOD_SETTINGS},
            {"Хранилище", Settings.ACTION_INTERNAL_STORAGE_SETTINGS},
            {"Заставка телевизора", "android.settings.DREAM_SETTINGS"},
            {"Об устройстве", Settings.ACTION_DEVICE_INFO_SETTINGS},
            {"Местоположение", Settings.ACTION_LOCATION_SOURCE_SETTINGS},
            {"Специальные возможности", Settings.ACTION_ACCESSIBILITY_SETTINGS},
            {"Для разработчиков", Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS},
            {"Все настройки (сброс, индикатор, Cast…)", Settings.ACTION_SETTINGS},
            {"Яркость главного экрана", "brightness"},
    };

    static final class App {
        String key;          // package name, or "url:<address>" for a website shortcut
        String label;
        String category;
        Drawable banner;     // the app's own TV banner, if it has one
        Drawable icon;       // otherwise its icon, shown on a colour card
        int color = 0xFF3A3F55;
        Intent launch;
        String url;
    }

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Map<String, App> apps = new LinkedHashMap<>();
    private SharedPreferences prefs;
    private String appsSignature = "";

    private FrameLayout root;
    private View background;
    private Drawable currentBg;
    private View dim;
    private TextView clock, date, heroCategory, heroTitle, heroDesc;
    private HorizontalScrollView rowScroll;
    private LinearLayout row;
    private final List<TextView> tabViews = new ArrayList<>();
    private int tab = 0;
    private View firstTile;
    private int lastColor = 0;

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            updateClock();
            ui.postDelayed(this, 10_000);
        }
    };

    // ---- lifecycle -------------------------------------------------------------------------------------

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("home", MODE_PRIVATE);
        buildUi();
        setContentView(root);
        applyBrightness();
        loadApps(true);
    }

    @Override
    protected void onResume() {
        super.onResume();
        ui.removeCallbacks(tick);
        tick.run();
        loadApps(false);   // picks up apps installed or removed while away
    }

    @Override
    protected void onPause() {
        ui.removeCallbacks(tick);
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        worker.shutdownNow();
        super.onDestroy();
    }

    /** Home pressed on the home screen: back to «Главная», first tile. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        goHome();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_UP) goHome();
            return true;   // a launcher never closes on Back
        }
        if (event.getKeyCode() == KeyEvent.KEYCODE_MENU && event.getAction() == KeyEvent.ACTION_UP) {
            View f = getCurrentFocus();
            if (f != null && f.getTag() instanceof App) {
                showAppMenu((App) f.getTag());
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    private void goHome() {
        if (tab != 0) selectTab(0, false);
        if (firstTile != null) firstTile.requestFocus();
        rowScroll.smoothScrollTo(0, 0);
    }

    // ---- layout ----------------------------------------------------------------------------------------

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private TextView text(float sp, int color, Typeface face) {
        TextView t = new TextView(this);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setTypeface(face);
        t.setIncludeFontPadding(false);
        return t;
    }

    /** Glass pill: translucent fill brighter at the top, thin light rim. */
    private GradientDrawable glass(float radiusDp, int alphaTop, int alphaBottom) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{Color.argb(alphaTop, 255, 255, 255), Color.argb(alphaBottom, 255, 255, 255)});
        g.setCornerRadius(dp(radiusDp));
        g.setStroke(dp(1), Color.argb(70, 255, 255, 255));
        return g;
    }

    private GradientDrawable focusedGlass(float radiusDp) {
        GradientDrawable g = glass(radiusDp, 90, 40);
        g.setStroke(dp(2), Color.WHITE);
        return g;
    }

    private FrameLayout.LayoutParams match() {
        return new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    }

    private void buildUi() {
        root = new FrameLayout(this);
        root.setBackgroundColor(0xFF06070C);

        background = new View(this);
        currentBg = backgroundFor(0xFF3A3F55);
        background.setBackground(currentBg);
        root.addView(background, match());

        View scrim = new View(this);
        GradientDrawable left = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{0xD006070C, 0x4006070C, 0x0006070C});
        GradientDrawable bottom = new GradientDrawable(GradientDrawable.Orientation.BOTTOM_TOP,
                new int[]{0xF006070C, 0x6006070C, 0x0006070C});
        scrim.setBackground(new LayerDrawable(new Drawable[]{left, bottom}));
        root.addView(scrim, match());

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(48), dp(28), 0, dp(22));
        content.setClipChildren(false);
        content.setClipToPadding(false);
        root.addView(content, match());

        // top bar: clock, date, buttons
        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(0, 0, dp(48), 0);
        top.setClipChildren(false);
        clock = text(38, Color.WHITE, Typeface.create("sans-serif-thin", Typeface.NORMAL));
        date = text(15, 0xB3F4F6FB, Typeface.create("sans-serif", Typeface.NORMAL));
        top.addView(clock);
        LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(-2, -2);
        dlp.leftMargin = dp(14);
        top.addView(date, dlp);
        top.addView(new View(this), new LinearLayout.LayoutParams(0, 1, 1f));
        top.addView(topButton("Источники", v -> openInputs()));
        top.addView(topButton("Wi‑Fi", v -> openSettings(Settings.ACTION_WIFI_SETTINGS)));
        top.addView(topButton("Настройки", v -> showSettings()));
        content.addView(top);

        content.addView(new View(this), new LinearLayout.LayoutParams(1, 0, 1f));

        // hero: the focused app
        heroCategory = text(12, 0xB3F4F6FB, Typeface.create("sans-serif-medium", Typeface.NORMAL));
        heroCategory.setLetterSpacing(0.2f);
        heroTitle = text(54, Color.WHITE, Typeface.create("sans-serif-black", Typeface.NORMAL));
        heroTitle.setLetterSpacing(-0.02f);
        heroTitle.setSingleLine(true);
        heroTitle.setEllipsize(TextUtils.TruncateAt.END);
        heroDesc = text(17, 0xC8F4F6FB, Typeface.create("sans-serif-light", Typeface.NORMAL));
        heroDesc.setMaxLines(2);
        heroDesc.setMaxWidth(dp(520));
        content.addView(heroCategory);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(-2, -2);
        tlp.topMargin = dp(10);
        tlp.rightMargin = dp(48);
        content.addView(heroTitle, tlp);
        LinearLayout.LayoutParams dsp = new LinearLayout.LayoutParams(-2, -2);
        dsp.topMargin = dp(10);
        content.addView(heroDesc, dsp);

        // glass category tabs
        LinearLayout tabs = new LinearLayout(this);
        tabs.setOrientation(LinearLayout.HORIZONTAL);
        tabs.setPadding(dp(5), dp(5), dp(5), dp(5));
        tabs.setBackground(glass(24, 34, 14));
        tabs.setClipChildren(false);
        for (int i = 0; i < TAB_NAMES.length; i++) {
            final int index = i;
            TextView t = text(15, 0xB3F4F6FB, Typeface.create("sans-serif-medium", Typeface.NORMAL));
            t.setText(TAB_NAMES[i]);
            t.setPadding(dp(18), dp(9), dp(18), dp(9));
            t.setFocusable(true);
            t.setOnFocusChangeListener((v, has) -> {
                styleTab((TextView) v, has, index == tab);
                if (has && index != tab) selectTab(index, true);
            });
            t.setOnClickListener(v -> {
                if (firstTile != null) firstTile.requestFocus();
            });
            tabViews.add(t);
            tabs.addView(t);
        }
        LinearLayout.LayoutParams tabsLp = new LinearLayout.LayoutParams(-2, -2);
        tabsLp.topMargin = dp(22);
        content.addView(tabs, tabsLp);

        // the row of tiles
        rowScroll = new HorizontalScrollView(this);
        rowScroll.setHorizontalScrollBarEnabled(false);
        rowScroll.setClipChildren(false);
        rowScroll.setClipToPadding(false);
        rowScroll.setSmoothScrollingEnabled(true);
        row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setClipChildren(false);
        row.setClipToPadding(false);
        row.setPadding(dp(2), dp(18), dp(48), dp(4));
        rowScroll.addView(row);
        LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(-1, -2);
        rowLp.topMargin = dp(6);
        content.addView(rowScroll, rowLp);

        dim = new View(this);
        dim.setBackgroundColor(Color.BLACK);
        dim.setAlpha(0f);
        dim.setFocusable(false);
        root.addView(dim, match());

        for (int i = 0; i < tabViews.size(); i++) styleTab(tabViews.get(i), false, i == tab);
    }

    private TextView topButton(String label, View.OnClickListener click) {
        TextView b = text(14, 0xE6F4F6FB, Typeface.create("sans-serif-medium", Typeface.NORMAL));
        b.setText(label);
        b.setPadding(dp(16), dp(9), dp(16), dp(9));
        b.setBackground(glass(20, 40, 14));
        b.setFocusable(true);
        b.setOnClickListener(click);
        b.setOnFocusChangeListener((v, has) -> {
            v.setBackground(has ? focusedGlass(20) : glass(20, 40, 14));
            v.animate().scaleX(has ? 1.08f : 1f).scaleY(has ? 1.08f : 1f).setDuration(180)
                    .setInterpolator(new OvershootInterpolator(1.4f)).start();
        });
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
        lp.leftMargin = dp(10);
        b.setLayoutParams(lp);
        return b;
    }

    private void styleTab(TextView t, boolean focused, boolean selected) {
        if (focused) {
            t.setBackground(focusedGlass(20));
            t.setTextColor(Color.WHITE);
        } else if (selected) {
            t.setBackground(glass(20, 70, 26));
            t.setTextColor(Color.WHITE);
        } else {
            t.setBackground(null);
            t.setTextColor(0xB3F4F6FB);
        }
        t.animate().scaleX(focused ? 1.06f : 1f).scaleY(focused ? 1.06f : 1f).setDuration(160).start();
    }

    private void selectTab(int index, boolean keepTabFocus) {
        tab = index;
        for (int i = 0; i < tabViews.size(); i++) {
            TextView t = tabViews.get(i);
            styleTab(t, keepTabFocus && t.hasFocus(), i == tab);
        }
        renderRow();
        rowScroll.scrollTo(0, 0);
    }

    // ---- background ------------------------------------------------------------------------------------

    private Drawable backgroundFor(int color) {
        int r = Color.red(color), g = Color.green(color), b = Color.blue(color);
        GradientDrawable glow = new GradientDrawable();
        glow.setGradientType(GradientDrawable.RADIAL_GRADIENT);
        glow.setColors(new int[]{Color.argb(170, r, g, b), Color.argb(60, r, g, b), Color.argb(0, r, g, b)});
        glow.setGradientCenter(0.78f, 0.22f);
        glow.setGradientRadius(dp(620));
        GradientDrawable low = new GradientDrawable();
        low.setGradientType(GradientDrawable.RADIAL_GRADIENT);
        low.setColors(new int[]{Color.argb(90, r, g, b), Color.argb(0, r, g, b)});
        low.setGradientCenter(0.1f, 0.95f);
        low.setGradientRadius(dp(480));
        return new LayerDrawable(new Drawable[]{new ColorDrawable(0xFF06070C), glow, low});
    }

    /** Cross-fades the background to the focused app's colour: two static layers, nothing drawn per frame. */
    private void tintBackground(int color) {
        if (color == lastColor) return;
        lastColor = color;
        Drawable next = backgroundFor(color);
        TransitionDrawable fade = new TransitionDrawable(new Drawable[]{currentBg, next});
        fade.setCrossFadeEnabled(true);
        background.setBackground(fade);
        fade.startTransition(450);
        currentBg = next;
    }

    // ---- apps ------------------------------------------------------------------------------------------

    private void loadApps(final boolean first) {
        worker.execute(() -> {
            final Map<String, App> found = queryApps();
            StringBuilder sig = new StringBuilder();
            for (String k : found.keySet()) sig.append(k).append(';');
            final String signature = sig.toString();
            ui.post(() -> {
                if (!first && signature.equals(appsSignature)) return;
                appsSignature = signature;
                apps.clear();
                apps.putAll(found);
                renderRow();
                if (first && firstTile != null) firstTile.requestFocus();
            });
        });
    }

    private Map<String, App> queryApps() {
        PackageManager pm = getPackageManager();
        Map<String, App> out = new LinkedHashMap<>();
        String[] categories = {Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER};
        for (String category : categories) {
            List<ResolveInfo> list = pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category), 0);
            for (ResolveInfo ri : list) {
                String pkg = ri.activityInfo.packageName;
                if (pkg.equals(getPackageName()) || out.containsKey(pkg)) continue;
                App a = new App();
                a.key = pkg;
                a.label = String.valueOf(ri.loadLabel(pm));
                a.category = categoryOf(pkg);
                try {
                    a.banner = ri.activityInfo.loadBanner(pm);
                    if (a.banner == null) a.banner = pm.getApplicationBanner(pkg);
                } catch (Exception ignored) {
                    a.banner = null;
                }
                try {
                    a.icon = ri.loadIcon(pm);
                } catch (Exception ignored) {
                    a.icon = null;
                }
                a.color = dominantColor(a.banner != null ? a.banner : a.icon);
                a.launch = pm.getLeanbackLaunchIntentForPackage(pkg);
                if (a.launch == null) a.launch = pm.getLaunchIntentForPackage(pkg);
                out.put(pkg, a);
            }
        }
        // website shortcuts pinned to «Главная»
        for (String key : pins()) {
            if (key.startsWith(WEB_PREFIX) && !out.containsKey(key)) {
                App a = new App();
                a.key = key;
                a.url = key.substring(WEB_PREFIX.length());
                a.label = labelForUrl(a.url);
                a.category = categoryOf(key);
                Bitmap fav = siteIcon(a.url);
                if (fav != null) a.icon = new BitmapDrawable(getResources(), fav);
                a.color = a.icon != null ? dominantColor(a.icon) : 0xFF2E7D4F;
                out.put(key, a);
            }
        }
        return out;
    }

    private static String categoryOf(String key) {
        for (String[] group : CATEGORY_PREFIXES) {
            for (int i = 1; i < group.length; i++) if (key.startsWith(group[i])) return group[0];
        }
        return "other";
    }

    private static String describe(App a) {
        for (Map.Entry<String, String> e : DESCRIPTIONS.entrySet()) {
            if (a.key.startsWith(e.getKey())) return e.getValue();
        }
        if (a.url != null) {
            String host = Uri.parse(a.url).getHost();
            return host != null ? host : a.url;
        }
        return "Приложение на телевизоре";
    }

    private static String labelForUrl(String url) {
        String host = Uri.parse(url).getHost();
        if (host == null) return url;
        if (host.contains("jut-su") || host.contains("jut.su")) return "Jut.su";
        return host.replaceFirst("^www\\.", "");
    }

    /** Average of the colourful pixels of a tiny copy of the image: the card tint and the background glow. */
    private static int dominantColor(Drawable d) {
        if (d == null || d.getConstantState() == null) return 0xFF3A3F55;
        try {
            Drawable copy = d.getConstantState().newDrawable().mutate();
            Bitmap b = Bitmap.createBitmap(24, 24, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            copy.setBounds(0, 0, 24, 24);
            copy.draw(c);
            long rs = 0, gs = 0, bs = 0, n = 0, ra = 0, ga = 0, ba = 0, na = 0;
            for (int y = 0; y < 24; y++) {
                for (int x = 0; x < 24; x++) {
                    int p = b.getPixel(x, y);
                    if (Color.alpha(p) < 160) continue;
                    int r = Color.red(p), g = Color.green(p), bl = Color.blue(p);
                    ra += r; ga += g; ba += bl; na++;
                    int max = Math.max(r, Math.max(g, bl)), min = Math.min(r, Math.min(g, bl));
                    if (max - min > 50 && max > 60) { rs += r; gs += g; bs += bl; n++; }
                }
            }
            b.recycle();
            if (n > 8) return Color.rgb((int) (rs / n), (int) (gs / n), (int) (bs / n));
            if (na > 0) return Color.rgb((int) (ra / na), (int) (ga / na), (int) (ba / na));
        } catch (RuntimeException ignored) {
            // fall back to the default tint
        }
        return 0xFF3A3F55;
    }

    /** The site's own large icon, cached on disk; null if it has none worth showing or there is no network. */
    private Bitmap siteIcon(String url) {
        String host = Uri.parse(url).getHost();
        if (host == null) return null;
        File f = new File(getFilesDir(), "site-" + host.replaceAll("[^a-zA-Z0-9.-]", "_") + ".png");
        if (f.exists()) return BitmapFactory.decodeFile(f.getPath());
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL("https://www.google.com/s2/favicons?sz=256&domain=" + host).openConnection();
            c.setConnectTimeout(4000);
            c.setReadTimeout(4000);
            try (InputStream in = c.getInputStream()) {
                Bitmap bmp = BitmapFactory.decodeStream(in);
                if (bmp == null || bmp.getWidth() < 64) return null;
                try (FileOutputStream out = new FileOutputStream(f)) {
                    bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
                }
                return bmp;
            }
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    // ---- «Главная» pins --------------------------------------------------------------------------------

    private List<String> pins() {
        String saved = prefs.getString("pins", null);
        if (saved == null) return new ArrayList<>(Arrays.asList(DEFAULT_PINS));
        List<String> out = new ArrayList<>();
        for (String s : saved.split("\n")) if (!s.isEmpty()) out.add(s);
        return out;
    }

    private void savePins(List<String> list) {
        prefs.edit().putString("pins", TextUtils.join("\n", list)).apply();
    }

    private List<App> appsForTab() {
        List<App> out = new ArrayList<>();
        String key = TAB_KEYS[tab];
        if (key.equals("home")) {
            for (String p : pins()) {
                App a = apps.get(p);
                if (a != null) out.add(a);
            }
            return out;
        }
        for (App a : apps.values()) {
            if (key.equals("all") || a.category.equals(key)) out.add(a);
        }
        if (key.equals("all")) Collections.sort(out, (x, y) -> x.label.compareToIgnoreCase(y.label));
        return out;
    }

    // ---- tiles -----------------------------------------------------------------------------------------

    private void renderRow() {
        View focused = getCurrentFocus();
        boolean tileHadFocus = focused != null && focused.getTag() instanceof App;
        row.removeAllViews();
        firstTile = null;
        List<App> list = appsForTab();
        for (App a : list) {
            View tile = tile(a);
            if (firstTile == null) firstTile = tile;
            row.addView(tile);
        }
        if (list.isEmpty()) {
            TextView empty = text(16, 0xB3F4F6FB, Typeface.DEFAULT);
            empty.setText(TAB_KEYS[tab].equals("home")
                    ? "Здесь пусто. Откройте «Все приложения» и удерживайте OK на приложении, чтобы добавить его."
                    : "В этом разделе пока нет приложений.");
            empty.setPadding(0, dp(40), 0, dp(40));
            row.addView(empty);
        } else if (tileHadFocus || getCurrentFocus() == null) {
            firstTile.requestFocus();
        }
    }

    private View tile(final App a) {
        final int w = dp(232), h = dp(130);
        final LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);
        box.setClipChildren(false);
        box.setFocusable(true);
        box.setTag(a);
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(w, -2);
        blp.rightMargin = dp(22);
        box.setLayoutParams(blp);

        final FrameLayout card = new FrameLayout(this);
        final float radius = dp(16);
        card.setOutlineProvider(new ViewOutlineProvider() {
            @Override public void getOutline(View view, Outline outline) {
                outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), radius);
            }
        });
        card.setClipToOutline(true);
        card.setElevation(dp(4));

        ImageView image = new ImageView(this);
        if (a.banner != null) {
            image.setImageDrawable(a.banner);
            image.setScaleType(ImageView.ScaleType.CENTER_CROP);
            card.addView(image, new FrameLayout.LayoutParams(-1, -1));
        } else {
            int c = a.color;
            card.setBackground(new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                    new int[]{lighten(c, 0.15f), darken(c, 0.45f)}));
            if (a.icon != null) {
                image.setImageDrawable(a.icon);
                image.setScaleType(ImageView.ScaleType.FIT_CENTER);
                card.addView(image, new FrameLayout.LayoutParams(dp(84), dp(84), Gravity.CENTER));
            } else {
                TextView letter = text(40, Color.WHITE, Typeface.create("sans-serif-black", Typeface.NORMAL));
                letter.setText(a.label.substring(0, Math.min(2, a.label.length())));
                card.addView(letter, new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER));
            }
        }

        // glass sheen and rim over the picture
        View sheen = new View(this);
        sheen.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{0x40FFFFFF, 0x08FFFFFF, 0x00FFFFFF}));
        card.addView(sheen, new FrameLayout.LayoutParams(-1, h / 2, Gravity.TOP));
        View rim = new View(this);
        GradientDrawable rimD = new GradientDrawable();
        rimD.setCornerRadius(radius);
        rimD.setStroke(dp(1), 0x55FFFFFF);
        rim.setBackground(rimD);
        card.addView(rim, new FrameLayout.LayoutParams(-1, -1));
        final View ring = new View(this);
        GradientDrawable ringD = new GradientDrawable();
        ringD.setCornerRadius(radius);
        ringD.setStroke(dp(3), Color.WHITE);
        ring.setBackground(ringD);
        ring.setAlpha(0f);
        card.addView(ring, new FrameLayout.LayoutParams(-1, -1));

        box.addView(card, new LinearLayout.LayoutParams(w, h));

        final TextView label = text(14, 0x99F4F6FB, Typeface.create("sans-serif-medium", Typeface.NORMAL));
        label.setText(a.label);
        label.setSingleLine(true);
        label.setEllipsize(TextUtils.TruncateAt.END);
        label.setGravity(Gravity.CENTER);
        label.setAlpha(0.6f);
        LinearLayout.LayoutParams llp = new LinearLayout.LayoutParams(-1, -2);
        llp.topMargin = dp(12);
        box.addView(label, llp);

        final OvershootInterpolator spring = new OvershootInterpolator(1.3f);
        final DecelerateInterpolator ease = new DecelerateInterpolator();
        final float lift = dp(6), depth = dp(10);
        box.setOnFocusChangeListener((v, has) -> {
            card.animate().scaleX(has ? 1.12f : 1f).scaleY(has ? 1.12f : 1f)
                    .translationY(has ? -lift : 0f).translationZ(has ? depth : 0f)
                    .setDuration(has ? 260 : 180).setInterpolator(has ? spring : ease).start();
            ring.animate().alpha(has ? 1f : 0f).setDuration(150).start();
            label.animate().alpha(has ? 1f : 0.6f).translationY(has ? lift : 0f).setDuration(180).start();
            label.setTextColor(has ? Color.WHITE : 0x99F4F6FB);
            if (has) showHero(a);
        });
        box.setOnClickListener(v -> open(a));
        box.setOnLongClickListener(v -> {
            showAppMenu(a);
            return true;
        });
        return box;
    }

    private static int lighten(int c, float f) {
        return Color.rgb((int) (Color.red(c) + (255 - Color.red(c)) * f),
                (int) (Color.green(c) + (255 - Color.green(c)) * f),
                (int) (Color.blue(c) + (255 - Color.blue(c)) * f));
    }

    private static int darken(int c, float f) {
        return Color.rgb((int) (Color.red(c) * (1 - f)), (int) (Color.green(c) * (1 - f)), (int) (Color.blue(c) * (1 - f)));
    }

    private void showHero(App a) {
        String cat = CATEGORY_TITLE.get(a.category);
        heroTitle.animate().cancel();
        heroTitle.setAlpha(0f);
        heroTitle.setTranslationY(dp(8));
        heroCategory.setText(cat == null ? "" : cat);
        heroTitle.setText(a.label);
        heroDesc.setText(describe(a));
        heroTitle.animate().alpha(1f).translationY(0f).setDuration(220).setInterpolator(new DecelerateInterpolator()).start();
        tintBackground(a.color);
    }

    // ---- actions ---------------------------------------------------------------------------------------

    private void start(Intent i) {
        try {
            startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (ActivityNotFoundException | SecurityException e) {
            Toast.makeText(this, "Не получилось открыть", Toast.LENGTH_SHORT).show();
        }
    }

    private void open(App a) {
        if (a.launch != null) {
            start(new Intent(a.launch).addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED));
        } else if (a.url != null) {
            openUrl(a.url);
        }
    }

    private void openUrl(String url) {
        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        Intent yandex = new Intent(view).setPackage(YANDEX_BROWSER);
        start(yandex.resolveActivity(getPackageManager()) != null ? yandex : view);
    }

    private void openSettings(String action) {
        Intent wanted = new Intent(action);
        if (wanted.resolveActivity(getPackageManager()) == null) wanted = new Intent(Settings.ACTION_SETTINGS);
        start(wanted);
    }

    /** The TV's own inputs screen (HDMI, tuner): TCL's live TV app, else the generic Android TV ones. */
    private void openInputs() {
        PackageManager pm = getPackageManager();
        for (String p : new String[]{"com.tcl.tv", "com.tcl.tvinput", "com.android.tv", "com.google.android.tv"}) {
            Intent i = pm.getLeanbackLaunchIntentForPackage(p);
            if (i == null) i = pm.getLaunchIntentForPackage(p);
            if (i != null) {
                start(i);
                return;
            }
        }
        openSettings(Settings.ACTION_SETTINGS);
    }

    private AlertDialog.Builder dialog(String title) {
        return new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert).setTitle(title);
    }

    private void showAppMenu(final App a) {
        boolean pinned = pins().contains(a.key);
        final List<String> items = new ArrayList<>();
        items.add(pinned ? "Убрать с «Главной»" : "Добавить на «Главную»");
        if (pinned) {
            items.add("Сдвинуть влево");
            items.add("Сдвинуть вправо");
        }
        if (a.url == null) items.add("О приложении");
        dialog(a.label).setItems(items.toArray(new String[0]), (d, which) -> {
            String item = items.get(which);
            if (item.equals("О приложении")) {
                start(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + a.key)));
                return;
            }
            List<String> list = pins();
            int i = list.indexOf(a.key);
            if (item.startsWith("Убрать")) {
                list.remove(a.key);
            } else if (item.startsWith("Добавить")) {
                list.add(a.key);
            } else if (item.equals("Сдвинуть влево") && i > 0) {
                Collections.swap(list, i, i - 1);
            } else if (item.equals("Сдвинуть вправо") && i >= 0 && i < list.size() - 1) {
                Collections.swap(list, i, i + 1);
            }
            savePins(list);
            renderRow();
            focusTileFor(a.key);
        }).show();
    }

    private void focusTileFor(String key) {
        for (int i = 0; i < row.getChildCount(); i++) {
            View v = row.getChildAt(i);
            if (v.getTag() instanceof App && ((App) v.getTag()).key.equals(key)) {
                v.requestFocus();
                return;
            }
        }
    }

    private void showSettings() {
        String[] labels = new String[TV_SETTINGS.length];
        for (int i = 0; i < labels.length; i++) labels[i] = TV_SETTINGS[i][0];
        dialog("Настройки").setItems(labels, (d, which) -> {
            String action = TV_SETTINGS[which][1];
            if (action.equals("inputs")) openInputs();
            else if (action.equals("brightness")) showBrightness();
            else openSettings(action);
        }).show();
    }

    private void showBrightness() {
        SeekBar bar = new SeekBar(this);
        bar.setMax(80);
        bar.setProgress(prefs.getInt("brightness", 100) - 20);
        bar.setPadding(dp(32), dp(24), dp(32), dp(24));
        bar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar s, int progress, boolean fromUser) {
                prefs.edit().putInt("brightness", progress + 20).apply();
                applyBrightness();
            }
            @Override public void onStartTrackingTouch(SeekBar s) { }
            @Override public void onStopTrackingTouch(SeekBar s) { }
        });
        dialog("Яркость главного экрана").setView(bar).setPositiveButton("Готово", null).show();
        bar.requestFocus();
    }

    private void applyBrightness() {
        int b = prefs.getInt("brightness", 100);
        dim.setAlpha(1f - b / 100f);
    }

    private void updateClock() {
        Date now = new Date();
        Locale ru = new Locale("ru", "RU");
        clock.setText(new SimpleDateFormat("HH:mm", ru).format(now));
        String d = new SimpleDateFormat("EEEE, d MMMM", ru).format(now);
        date.setText(d.isEmpty() ? d : Character.toUpperCase(d.charAt(0)) + d.substring(1));
    }
}
