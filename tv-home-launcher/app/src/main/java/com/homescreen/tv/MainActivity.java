package com.homescreen.tv;

import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.StateListDrawable;
import android.graphics.drawable.TransitionDrawable;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.view.animation.OvershootInterpolator;
import android.view.animation.PathInterpolator;
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
import java.util.Calendar;
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
 * Framework views only, so every movement runs on the hardware renderer like the TV's own menus. Tiles are
 * built once per app and reused; tab changes, row scrolling and the colour glow are short property animations
 * of already-drawn layers, so nothing heavy happens while the remote is moving.
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

    /** Liquid glass wallpapers, one per half hour. */
    static final int[] WALLPAPERS = {R.drawable.wp_ultraviolet, R.drawable.wp_lagoon, R.drawable.wp_sunset,
            R.drawable.wp_aurora};

    static final float FOCUS_SCALE = 1.08f;
    /** Tile size in dp, set from the screen: about a fifth of its width, 16:9. */
    private float TILE_W = 216, TILE_H = 122;

    /** Material "emphasized" easing: quick start, long soft landing. */
    static final PathInterpolator EASE = new PathInterpolator(0.2f, 0f, 0f, 1f);

    static final class App {
        String key;          // package name, or "url:<address>" for a website shortcut
        String label;
        String category;
        Drawable banner;     // the app's own TV banner, if it has one
        Drawable icon;       // otherwise its icon, shown on a colour card
        int color = 0xFF3A3F55;
        Bitmap backdrop;     // the app's picture, heavily blurred: the screen background while it is focused
        Bitmap cardBg;       // the same, brighter: the card behind an icon when the app has no banner
        Bitmap tile;         // the finished card: picture, rounded corners, glass sheen and rim, at focused size
        Intent launch;
        String url;
    }

    /** A row that never jumps to the focused tile by itself: the activity glides it there. */
    static final class GlideRow extends HorizontalScrollView {
        GlideRow(Context c) { super(c); }
        @Override public boolean requestChildRectangleOnScreen(View child, Rect r, boolean immediate) { return false; }
        @Override protected int computeScrollDeltaToGetChildRectOnScreen(Rect rect) { return 0; }
    }

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Map<String, App> apps = new LinkedHashMap<>();
    private final Map<String, View> tileCache = new HashMap<>();
    private SharedPreferences prefs;
    private String appsSignature = "";

    private FrameLayout root;
    private ImageView wallA, wallB, glow;
    private View scrim;
    private int wallIndex = -1;
    private View dim;
    private TextView greeting, clock, date, heroCategory, heroTitle, heroDesc;
    private GlideRow rowScroll;
    private LinearLayout row;
    private final List<TextView> tabViews = new ArrayList<>();
    private int tab = 0;
    private int pendingTab = -1;
    private View firstTile;
    private String backdropKey = "";
    private App heroApp;
    private ValueAnimator scrollAnim;

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            updateClock();
            updateWallpaper(false);
            ui.postDelayed(this, 10_000);
        }
    };
    private final Runnable applyPendingTab = () -> {
        if (pendingTab >= 0 && pendingTab != tab) switchTab(pendingTab);
        pendingTab = -1;
    };
    private App pendingBackdrop;
    private final Runnable applyGlow = () -> fadeBackdrop(pendingBackdrop);

    // ---- lifecycle -------------------------------------------------------------------------------------

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("home", MODE_PRIVATE);
        DisplayMetrics m = getResources().getDisplayMetrics();
        float screenDp = Math.max(m.widthPixels, m.heightPixels) / m.density;
        TILE_W = Math.round(screenDp * 0.215f);
        TILE_H = Math.round(TILE_W * 9f / 16f);
        buildUi();
        setContentView(root);
        applyBrightness();
        updateWallpaper(true);
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
        int code = event.getKeyCode();
        if (code == KeyEvent.KEYCODE_MENU || code == KeyEvent.KEYCODE_SETTINGS) {
            if (event.getAction() == KeyEvent.ACTION_UP) {
                View f = getCurrentFocus();
                if (code == KeyEvent.KEYCODE_MENU && f != null && f.getTag() instanceof App) {
                    showAppMenu((App) f.getTag());
                } else {
                    showSettings();   // the settings list now lives on the remote's Menu / Settings key
                }
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private void goHome() {
        ui.removeCallbacks(applyPendingTab);
        pendingTab = -1;
        if (firstTile != null) firstTile.requestFocus();   // a focused tile carries focus into the new row
        if (tab != 0) switchTab(0);
        else glideTo(0);
    }

    // ---- small helpers ---------------------------------------------------------------------------------

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

    private FrameLayout.LayoutParams match() {
        return new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    }

    /** Liquid glass surface: brighter top, a light rim; focused = denser glass and a white rim. */
    private GradientDrawable glass(float radiusDp, int alphaTop, int alphaBottom, int rimAlpha, float rimDp) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{Color.argb(alphaTop, 255, 255, 255), Color.argb(alphaBottom, 255, 255, 255)});
        g.setCornerRadius(dp(radiusDp));
        g.setStroke(dp(rimDp), Color.argb(rimAlpha, 255, 255, 255));
        return g;
    }

    /** One drawable per view that switches by state: no allocation while the remote moves. */
    private StateListDrawable glassStates(float radiusDp, boolean showIdle) {
        StateListDrawable s = new StateListDrawable();
        s.addState(new int[]{android.R.attr.state_focused}, glass(radiusDp, 95, 38, 0x8C, 1));
        s.addState(new int[]{android.R.attr.state_selected}, glass(radiusDp, 70, 22, 90, 1));
        if (showIdle) s.addState(new int[]{}, glass(radiusDp, 40, 12, 70, 1));
        s.setEnterFadeDuration(220);
        s.setExitFadeDuration(220);
        return s;
    }

    private ColorStateList textStates() {
        return new ColorStateList(
                new int[][]{{android.R.attr.state_focused}, {android.R.attr.state_selected}, {}},
                new int[]{Color.WHITE, Color.WHITE, 0xB3F4F6FB});
    }

    // ---- layout ----------------------------------------------------------------------------------------

    private void buildUi() {
        root = new FrameLayout(this);
        root.setBackgroundColor(0xFF06070C);

        // wallpapers (cross-fade every half hour) and the app-colour glow (two tiny textures, cross-fade)
        wallA = wallView();
        wallB = wallView();
        wallB.setAlpha(0f);
        root.addView(wallA, match());
        root.addView(wallB, match());
        glow = glowView();
        root.addView(glow, match());

        scrim = new View(this);
        GradientDrawable left = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{0xC806070C, 0x5506070C, 0x0006070C});
        GradientDrawable bottom = new GradientDrawable(GradientDrawable.Orientation.BOTTOM_TOP,
                new int[]{0xF206070C, 0x8806070C, 0x0006070C});
        scrim.setBackground(new LayerDrawable(new Drawable[]{left, bottom}));
        root.addView(scrim, match());

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(52), dp(30), 0, dp(20));
        content.setClipChildren(false);
        content.setClipToPadding(false);
        root.addView(content, match());

        // top bar, one line: clock | greeting over date | … | round glass icon buttons
        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(0, 0, dp(52), 0);
        top.setClipChildren(false);
        top.setClipToPadding(false);
        clock = text(42, Color.WHITE, Typeface.create("sans-serif-thin", Typeface.NORMAL));
        top.addView(clock, new LinearLayout.LayoutParams(-2, -2));
        LinearLayout dateBox = new LinearLayout(this);
        dateBox.setOrientation(LinearLayout.VERTICAL);
        greeting = text(11, 0xCCF4F6FB, Typeface.create("sans-serif-medium", Typeface.NORMAL));
        greeting.setLetterSpacing(0.2f);
        date = text(15, 0xD9F4F6FB, Typeface.create("sans-serif", Typeface.NORMAL));
        dateBox.addView(greeting);
        LinearLayout.LayoutParams dl = new LinearLayout.LayoutParams(-2, -2);
        dl.topMargin = dp(4);
        dateBox.addView(date, dl);
        LinearLayout.LayoutParams dbl = new LinearLayout.LayoutParams(-2, -2);
        dbl.leftMargin = dp(18);
        top.addView(dateBox, dbl);
        top.addView(new View(this), new LinearLayout.LayoutParams(0, 1, 1f));
        top.addView(iconButton(R.drawable.ic_input, "Источники", v -> openInputs()));
        top.addView(iconButton(R.drawable.ic_wifi, "Wi‑Fi", v -> openSettings(Settings.ACTION_WIFI_SETTINGS)));
        content.addView(top);

        content.addView(new View(this), new LinearLayout.LayoutParams(1, 0, 1f));

        // hero: the focused app
        heroCategory = text(12, 0xD9F4F6FB, Typeface.create("sans-serif-medium", Typeface.NORMAL));
        heroCategory.setLetterSpacing(0.22f);
        heroCategory.setSingleLine(true);
        heroTitle = text(58, Color.WHITE, Typeface.create("sans-serif-black", Typeface.NORMAL));
        heroTitle.setLetterSpacing(-0.02f);
        heroTitle.setSingleLine(true);
        heroTitle.setEllipsize(TextUtils.TruncateAt.END);
        heroTitle.setShadowLayer(dp(18), 0, dp(4), 0x66000000);
        heroDesc = text(17, 0xD0F4F6FB, Typeface.create("sans-serif-light", Typeface.NORMAL));
        heroDesc.setMaxLines(2);
        heroDesc.setEllipsize(TextUtils.TruncateAt.END);
        heroDesc.setLineSpacing(dp(3), 1f);
        // Fixed sizes: a new title or description never asks the whole screen to re-measure mid-animation.
        LinearLayout.LayoutParams cat = new LinearLayout.LayoutParams(dp(520), dp(16));
        content.addView(heroCategory, cat);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(dp(800), dp(80));
        tlp.topMargin = dp(10);
        content.addView(heroTitle, tlp);
        heroTitle.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams dsp = new LinearLayout.LayoutParams(dp(560), dp(50));
        dsp.topMargin = dp(6);
        content.addView(heroDesc, dsp);

        // glass category tabs
        LinearLayout tabs = new LinearLayout(this);
        tabs.setOrientation(LinearLayout.HORIZONTAL);
        tabs.setPadding(dp(5), dp(5), dp(5), dp(5));
        tabs.setBackground(glass(26, 34, 10, 60, 1));
        tabs.setClipChildren(false);
        tabs.setClipToPadding(false);
        for (int i = 0; i < TAB_NAMES.length; i++) {
            final int index = i;
            TextView t = text(15, Color.WHITE, Typeface.create("sans-serif-medium", Typeface.NORMAL));
            t.setText(TAB_NAMES[i]);
            t.setTextColor(textStates());
            t.setPadding(dp(18), dp(9), dp(18), dp(9));
            t.setBackground(glassStates(20, false));
            t.setFocusable(true);
            t.setOnFocusChangeListener((v, has) -> {
                if (has && index != tab) {
                    pendingTab = index;
                    ui.removeCallbacks(applyPendingTab);
                    ui.postDelayed(applyPendingTab, 220);   // skip tabs the remote only passes over
                }
            });
            t.setOnClickListener(v -> {
                ui.removeCallbacks(applyPendingTab);
                if (index != tab) switchTab(index);
                if (firstTile != null) firstTile.requestFocus();
            });
            tabViews.add(t);
            tabs.addView(t);
        }
        LinearLayout.LayoutParams tabsLp = new LinearLayout.LayoutParams(-2, -2);
        tabsLp.topMargin = dp(24);
        content.addView(tabs, tabsLp);

        // the row of tiles
        rowScroll = new GlideRow(this);
        rowScroll.setHorizontalScrollBarEnabled(false);
        rowScroll.setClipChildren(false);
        rowScroll.setClipToPadding(false);
        rowScroll.setOverScrollMode(View.OVER_SCROLL_NEVER);
        rowScroll.setHorizontalFadingEdgeEnabled(false);
        row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setClipChildren(false);
        row.setClipToPadding(false);
        row.forceHasOverlappingRendering(false);   // tab fades must not clip tiles to the row's rectangle
        row.setPadding(dp(14), dp(30), dp(400), dp(8));
        rowScroll.addView(row);
        LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(-1, -2);
        rowLp.topMargin = dp(4);
        content.addView(rowScroll, rowLp);

        dim = new View(this);
        dim.setBackgroundColor(Color.BLACK);
        dim.setAlpha(0f);
        dim.setFocusable(false);
        root.addView(dim, match());

        markSelectedTab();
    }

    private ImageView wallView() {
        ImageView v = new ImageView(this);
        v.setScaleType(ImageView.ScaleType.CENTER_CROP);
        return v;
    }

    private ImageView glowView() {
        ImageView v = new ImageView(this);
        v.setScaleType(ImageView.ScaleType.FIT_XY);
        return v;
    }

    /** Round glass icon button (the name is read out by accessibility, not printed). */
    private View iconButton(int iconRes, String name, View.OnClickListener click) {
        ImageView b = new ImageView(this);
        b.setImageResource(iconRes);
        b.setScaleType(ImageView.ScaleType.FIT_CENTER);
        b.setPadding(dp(13), dp(13), dp(13), dp(13));
        b.setBackground(glassStates(25, true));
        b.setContentDescription(name);
        b.setFocusable(true);
        b.setOnClickListener(click);
        b.setOnFocusChangeListener((v, has) -> v.animate().scaleX(has ? 1.1f : 1f).scaleY(has ? 1.1f : 1f)
                .setDuration(300).setInterpolator(EASE).start());
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(50), dp(50));
        lp.leftMargin = dp(14);
        b.setLayoutParams(lp);
        return b;
    }

    private void markSelectedTab() {
        for (int i = 0; i < tabViews.size(); i++) tabViews.get(i).setSelected(i == tab);
    }

    /** Old tiles slide out to the left and fade, the new set slides in from the right. */
    private void switchTab(int index) {
        tab = index;
        markSelectedTab();
        row.animate().cancel();
        row.animate().alpha(0f).translationX(-dp(24)).setDuration(120).setInterpolator(EASE)
                .withEndAction(() -> {
                    if (scrollAnim != null) scrollAnim.cancel();
                    rowScroll.scrollTo(0, 0);
                    renderRow(true);
                    row.setTranslationX(dp(40));
                    row.animate().alpha(1f).translationX(0f).setDuration(320).setInterpolator(EASE).start();
                }).start();
    }

    // ---- background ------------------------------------------------------------------------------------

    private void updateWallpaper(boolean first) {
        Calendar c = Calendar.getInstance();
        int index = ((c.get(Calendar.HOUR_OF_DAY) * 2) + (c.get(Calendar.MINUTE) / 30)) % WALLPAPERS.length;
        if (index == wallIndex) return;
        wallIndex = index;
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inPreferredConfig = Bitmap.Config.RGB_565;   // half the memory, invisible on a soft gradient
        Bitmap bmp = BitmapFactory.decodeResource(getResources(), WALLPAPERS[index], o);
        if (first) {
            wallA.setImageBitmap(bmp);
            return;
        }
        ImageView front = wallA.getAlpha() > 0.5f ? wallA : wallB;
        ImageView back = front == wallA ? wallB : wallA;
        back.setImageBitmap(bmp);
        back.animate().alpha(1f).setDuration(1500).setInterpolator(EASE).start();
        front.animate().alpha(0f).setDuration(1500).setInterpolator(EASE).start();
    }

    /** A 96×54 glow in the app's colour, scaled up by the GPU: soft as a blur and costs nothing per frame. */
    private Bitmap glowBitmap(int color) {
        int w = 96, h = 54;
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        int r = Color.red(color), g = Color.green(color), bl = Color.blue(color);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setShader(new RadialGradient(w * 0.8f, h * 0.2f, w * 0.62f,
                new int[]{Color.argb(150, r, g, bl), Color.argb(55, r, g, bl), Color.argb(0, r, g, bl)},
                new float[]{0f, 0.5f, 1f}, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h, p);
        p.setShader(new RadialGradient(w * 0.12f, h * 0.95f, w * 0.45f,
                new int[]{Color.argb(70, r, g, bl), Color.argb(0, r, g, bl)}, null, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h, p);
        return b;
    }

    /**
     * The app's banner (or its icon on a colour card) drawn into a 48×27 bitmap and box-blurred three times.
     * Scaled to the full screen by the GPU it reads as a heavy blur, and it is computed once per app.
     */
    private static Bitmap backdropFor(App a, float brightness) {
        final int w = 48, h = 27;
        try {
            Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            c.drawColor(darken(a.color, 0.35f));
            Drawable src = a.banner != null ? a.banner : a.icon;
            if (src != null && src.getConstantState() != null) {
                Drawable d = src.getConstantState().newDrawable().mutate();
                if (a.banner != null) {
                    d.setBounds(0, 0, w, h);
                } else {
                    int s = (int) (h * 1.5f);
                    d.setBounds(w / 2 - s / 2, h / 2 - s / 2, w / 2 + s / 2, h / 2 + s / 2);
                }
                d.draw(c);
            }
            int[] px = new int[w * h];
            b.getPixels(px, 0, w, 0, 0, w, h);
            for (int pass = 0; pass < 3; pass++) boxBlur(px, w, h, 3);
            for (int i = 0; i < px.length; i++) px[i] = moodColor(px[i], brightness);
            if (brightness < 0.9f) bakeScrim(px, w, h);
            b.setPixels(px, 0, w, 0, 0, w, h);
            return b;
        } catch (RuntimeException e) {
            return null;
        }
    }

    /**
     * Draws the banner once at exactly the pixel size it is shown at when focused (centre-cropped, filtered),
     * then applies an unsharp mask. The GPU then only ever shrinks it a little, so edges and text stay crisp.
     */
    private static Bitmap sharpBanner(Drawable banner, int w, int h) {
        if (banner == null || banner.getConstantState() == null || w <= 0 || h <= 0) return null;
        if (banner instanceof BitmapDrawable && ((BitmapDrawable) banner).getBitmap() != null) {
            Bitmap hq = bicubicCover(((BitmapDrawable) banner).getBitmap(), w, h);
            if (hq != null) return hq;
        }
        try {
            Drawable d = banner.getConstantState().newDrawable().mutate();
            if (d instanceof BitmapDrawable) {
                ((BitmapDrawable) d).setFilterBitmap(true);
                ((BitmapDrawable) d).setAntiAlias(true);
            }
            Bitmap out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(out);
            int iw = d.getIntrinsicWidth(), ih = d.getIntrinsicHeight();
            if (iw <= 0 || ih <= 0) {
                d.setBounds(0, 0, w, h);
            } else {
                float scale = Math.max(w / (float) iw, h / (float) ih);
                int dw = Math.round(iw * scale), dh = Math.round(ih * scale);
                int l = (w - dw) / 2, t = (h - dh) / 2;
                d.setBounds(l, t, l + dw, t + dh);
            }
            d.draw(c);
            int[] px = new int[w * h];
            out.getPixels(px, 0, w, 0, 0, w, h);
            int[] soft = px.clone();
            boxBlur(soft, w, h, 1);
            float amount = 0.7f;
            for (int i = 0; i < px.length; i++) {
                int p = px[i], q = soft[i];
                int r = clamp(((p >> 16) & 0xFF) + Math.round(amount * (((p >> 16) & 0xFF) - ((q >> 16) & 0xFF))));
                int g = clamp(((p >> 8) & 0xFF) + Math.round(amount * (((p >> 8) & 0xFF) - ((q >> 8) & 0xFF))));
                int b = clamp((p & 0xFF) + Math.round(amount * ((p & 0xFF) - (q & 0xFF))));
                px[i] = (p & 0xFF000000) | (r << 16) | (g << 8) | b;
            }
            out.setPixels(px, 0, w, 0, 0, w, h);
            return out;
        } catch (RuntimeException | OutOfMemoryError e) {
            return null;
        }
    }

    /**
     * Centre-crops the source to the target's aspect and resamples it with a Catmull-Rom bicubic filter
     * (much sharper than the GPU's bilinear stretch), halving first when the source is far larger; then a
     * light unsharp mask, stronger when the picture had to be enlarged.
     */
    static Bitmap bicubicCover(Bitmap src, int W, int H) {
        try {
            if (Build.VERSION.SDK_INT >= 26 && src.getConfig() == Bitmap.Config.HARDWARE) {
                src = src.copy(Bitmap.Config.ARGB_8888, false);
            }
            int sw0 = src.getWidth(), sh0 = src.getHeight();
            float target = W / (float) H;
            int cw = sw0, ch = sh0;
            if (sw0 / (float) sh0 > target) cw = Math.round(sh0 * target); else ch = Math.round(sw0 / target);
            Bitmap crop = Bitmap.createBitmap(src, (sw0 - cw) / 2, (sh0 - ch) / 2, cw, ch);
            while (crop.getWidth() >= W * 2 && crop.getHeight() >= H * 2) {
                crop = Bitmap.createScaledBitmap(crop, crop.getWidth() / 2, crop.getHeight() / 2, true);
            }
            int sw = crop.getWidth(), sh = crop.getHeight();
            float upscale = W / (float) sw;
            int[] in = new int[sw * sh];
            crop.getPixels(in, 0, sw, 0, 0, sw, sh);
            float sx = sw / (float) W, sy = sh / (float) H;
            float[] tmp = new float[W * sh * 4];
            for (int x = 0; x < W; x++) {
                float fx = (x + 0.5f) * sx - 0.5f;
                int ix = (int) Math.floor(fx);
                float t = fx - ix;
                float w0 = cubic(t + 1), w1 = cubic(t), w2 = cubic(1 - t), w3 = cubic(2 - t);
                int x0 = cl(ix - 1, sw), x1 = cl(ix, sw), x2 = cl(ix + 1, sw), x3 = cl(ix + 2, sw);
                for (int y = 0; y < sh; y++) {
                    int row = y * sw, o = (y * W + x) * 4;
                    int p0 = in[row + x0], p1 = in[row + x1], p2 = in[row + x2], p3 = in[row + x3];
                    for (int c = 0; c < 4; c++) {
                        int sh8 = 24 - c * 8;
                        tmp[o + c] = ((p0 >>> sh8) & 0xFF) * w0 + ((p1 >>> sh8) & 0xFF) * w1
                                + ((p2 >>> sh8) & 0xFF) * w2 + ((p3 >>> sh8) & 0xFF) * w3;
                    }
                }
            }
            int[] out = new int[W * H];
            for (int y = 0; y < H; y++) {
                float fy = (y + 0.5f) * sy - 0.5f;
                int iy = (int) Math.floor(fy);
                float t = fy - iy;
                float w0 = cubic(t + 1), w1 = cubic(t), w2 = cubic(1 - t), w3 = cubic(2 - t);
                int y0 = cl(iy - 1, sh), y1 = cl(iy, sh), y2 = cl(iy + 1, sh), y3 = cl(iy + 2, sh);
                for (int x = 0; x < W; x++) {
                    int pix = 0;
                    for (int c = 0; c < 4; c++) {
                        float v = tmp[(y0 * W + x) * 4 + c] * w0 + tmp[(y1 * W + x) * 4 + c] * w1
                                + tmp[(y2 * W + x) * 4 + c] * w2 + tmp[(y3 * W + x) * 4 + c] * w3;
                        pix |= clamp(Math.round(v)) << (24 - c * 8);
                    }
                    out[y * W + x] = pix;
                }
            }
            float amount = upscale > 1.15f ? 0.45f : 0.2f;
            int[] soft = out.clone();
            boxBlur(soft, W, H, 1);
            for (int i = 0; i < out.length; i++) {
                int p = out[i], q = soft[i];
                int r = clamp(((p >> 16) & 0xFF) + Math.round(amount * (((p >> 16) & 0xFF) - ((q >> 16) & 0xFF))));
                int g = clamp(((p >> 8) & 0xFF) + Math.round(amount * (((p >> 8) & 0xFF) - ((q >> 8) & 0xFF))));
                int b = clamp((p & 0xFF) + Math.round(amount * ((p & 0xFF) - (q & 0xFF))));
                out[i] = (p & 0xFF000000) | (r << 16) | (g << 8) | b;
            }
            Bitmap result = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
            result.setPixels(out, 0, W, 0, 0, W, H);
            return result;
        } catch (RuntimeException | OutOfMemoryError e) {
            return null;
        }
    }

    private static float cubic(float x) {
        x = Math.abs(x);
        if (x < 1f) return (1.5f * x - 2.5f) * x * x + 1f;
        if (x < 2f) return ((-0.5f * x + 2.5f) * x - 4f) * x + 2f;
        return 0f;
    }

    private static int cl(int i, int n) {
        return i < 0 ? 0 : (i >= n ? n - 1 : i);
    }

    private static int clamp(int v) {
        return v < 0 ? 0 : (v > 255 ? 255 : v);
    }

    private static void boxBlur(int[] px, int w, int h, int r) {
        int[] tmp = new int[px.length];
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int rs = 0, gs = 0, bs = 0, n = 0;
                for (int k = -r; k <= r; k++) {
                    int p = px[y * w + Math.max(0, Math.min(w - 1, x + k))];
                    rs += (p >> 16) & 0xFF; gs += (p >> 8) & 0xFF; bs += p & 0xFF; n++;
                }
                tmp[y * w + x] = 0xFF000000 | ((rs / n) << 16) | ((gs / n) << 8) | (bs / n);
            }
        }
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int rs = 0, gs = 0, bs = 0, n = 0;
                for (int k = -r; k <= r; k++) {
                    int p = tmp[Math.max(0, Math.min(h - 1, y + k)) * w + x];
                    rs += (p >> 16) & 0xFF; gs += (p >> 8) & 0xFF; bs += p & 0xFF; n++;
                }
                px[y * w + x] = 0xFF000000 | ((rs / n) << 16) | ((gs / n) << 8) | (bs / n);
            }
        }
    }

    /**
     * The left and bottom darkening that keeps the text readable, painted into the backdrop itself, so the
     * screen needs no separate full-screen scrim layer (one less full-screen fill every frame).
     */
    private static void bakeScrim(int[] px, int w, int h) {
        for (int y = 0; y < h; y++) {
            float fromBottom = (h - 1 - y) / (float) (h - 1);
            float bottom = 0.92f * Math.max(0f, 1f - fromBottom / 0.62f);
            for (int x = 0; x < w; x++) {
                float left = 0.72f * Math.max(0f, 1f - (x / (float) (w - 1)) / 0.7f);
                float keep = (1f - left) * (1f - bottom);
                int p = px[y * w + x];
                int r = (int) (((p >> 16) & 0xFF) * keep + 6 * (1 - keep));
                int g = (int) (((p >> 8) & 0xFF) * keep + 7 * (1 - keep));
                int b = (int) ((p & 0xFF) * keep + 12 * (1 - keep));
                px[y * w + x] = 0xFF000000 | (r << 16) | (g << 8) | b;
            }
        }
    }

    /** A little richer and darker, so white text stays readable over any picture. */
    private static int moodColor(int p, float k) {
        float r = ((p >> 16) & 0xFF), g = ((p >> 8) & 0xFF), b = (p & 0xFF);
        float grey = (r + g + b) / 3f;
        r = grey + (r - grey) * 1.3f;
        g = grey + (g - grey) * 1.3f;
        b = grey + (b - grey) * 1.3f;
        int ri = Math.max(0, Math.min(255, (int) (r * k)));
        int gi = Math.max(0, Math.min(255, (int) (g * k)));
        int bi = Math.max(0, Math.min(255, (int) (b * k)));
        return 0xFF000000 | (ri << 16) | (gi << 8) | bi;
    }

    private void tintFor(App a) {
        if (a.key.equals(backdropKey)) return;
        pendingBackdrop = a;
        ui.removeCallbacks(applyGlow);
        ui.postDelayed(applyGlow, 140);   // only the tile the remote stops on repaints the screen
    }

    /** Cross-fades the screen to the focused app's blurred picture (or its colour glow if it has none). */
    private void fadeBackdrop(App a) {
        if (a == null || a.key.equals(backdropKey)) return;
        backdropKey = a.key;
        // The new picture fades in OVER the old one, which stays fully opaque underneath: nothing behind
        // (the wallpaper) can show through halfway.
        Drawable next = new BitmapDrawable(getResources(), a.backdrop != null ? a.backdrop : glowBitmap(a.color));
        Drawable prev = glow.getDrawable();
        if (prev instanceof TransitionDrawable) prev = ((TransitionDrawable) prev).getDrawable(1);
        if (prev == null) prev = new ColorDrawable(Color.TRANSPARENT);
        TransitionDrawable fade = new TransitionDrawable(new Drawable[]{prev, next});
        fade.setCrossFadeEnabled(false);
        glow.setImageDrawable(fade);
        fade.startTransition(650);
        final boolean opaque = a.backdrop != null;
        if (!opaque) {
            scrim.setVisibility(View.VISIBLE);
            wallA.setVisibility(View.VISIBLE);
            wallB.setVisibility(View.VISIBLE);
        } else {
            ui.postDelayed(() -> {
                if (!backdropKey.equals(a.key)) return;
                scrim.setVisibility(View.GONE);      // baked into the picture
                wallA.setVisibility(View.INVISIBLE); // fully covered: stop drawing it
                wallB.setVisibility(View.INVISIBLE);
            }, 700);
        }
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
                tileCache.clear();
                renderRow(true);
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
                a.banner = hiRes(pm, ri, true);
                if (a.banner == null) {
                    try {
                        a.banner = ri.activityInfo.loadBanner(pm);
                        if (a.banner == null) a.banner = pm.getApplicationBanner(pkg);
                    } catch (Exception ignored) {
                        a.banner = null;
                    }
                }
                a.icon = hiRes(pm, ri, false);
                if (a.icon == null) {
                    try {
                        a.icon = ri.loadIcon(pm);
                    } catch (Exception ignored) {
                        a.icon = null;
                    }
                }
                a.color = dominantColor(a.banner != null ? a.banner : a.icon);
                a.backdrop = backdropFor(a, 0.62f);
                if (a.banner == null) a.cardBg = backdropFor(a, 1.05f);
                a.tile = tileBitmap(a);
                a.launch = pm.getLeanbackLaunchIntentForPackage(pkg);
                if (a.launch == null) a.launch = pm.getLaunchIntentForPackage(pkg);
                out.put(pkg, a);
            }
        }
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
                a.backdrop = backdropFor(a, 0.62f);
                a.cardBg = backdropFor(a, 1.05f);
                a.tile = tileBitmap(a);
                out.put(key, a);
            }
        }
        return out;
    }

    /**
     * The banner or icon from the app's highest-density resources (xxxhdpi when it has one). The default
     * loaders pick the TV's own density bucket, which is often a small picture stretched up and soft.
     */
    private static Drawable hiRes(PackageManager pm, ResolveInfo ri, boolean banner) {
        try {
            ActivityInfo ai = ri.activityInfo;
            int res = banner ? (ai.banner != 0 ? ai.banner : ai.applicationInfo.banner) : ai.getIconResource();
            if (res == 0) return null;
            Resources r = pm.getResourcesForApplication(ai.applicationInfo);
            return r.getDrawableForDensity(res, DisplayMetrics.DENSITY_XXXHIGH, null);
        } catch (Exception e) {
            return null;
        }
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

    private void renderRow(boolean keepTileFocus) {
        View focused = getCurrentFocus();
        boolean tileHadFocus = focused != null && focused.getTag() instanceof App;
        row.removeAllViews();
        firstTile = null;
        List<App> list = appsForTab();
        for (App a : list) {
            View tile = tileCache.get(a.key);
            if (tile == null) {
                tile = tile(a);
                tileCache.put(a.key, tile);
            }
            if (tile.getParent() instanceof ViewGroup) ((ViewGroup) tile.getParent()).removeView(tile);
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
        } else if ((keepTileFocus && tileHadFocus) || getCurrentFocus() == null) {
            firstTile.requestFocus();
        } else if (firstTile != null && heroApp == null) {
            showHero((App) firstTile.getTag());
        }
    }

    /** Scrolls the row so the focused tile sits second from the left, with one soft glide. */
    private void glideTo(int x) {
        int max = Math.max(0, row.getWidth() - rowScroll.getWidth());
        int target = Math.max(0, Math.min(x, max));
        if (scrollAnim != null) scrollAnim.cancel();
        int from = rowScroll.getScrollX();
        if (from == target) return;
        scrollAnim = ValueAnimator.ofInt(from, target);
        scrollAnim.setDuration(420);
        scrollAnim.setInterpolator(EASE);
        scrollAnim.addUpdateListener(an -> rowScroll.scrollTo((Integer) an.getAnimatedValue(), 0));
        scrollAnim.start();
    }

    /**
     * Renders the whole card once: the picture (sharpened banner, or the icon over its blurred self),
     * rounded corners, a faint glass sheen, a bright rim and a dark inner line — at the focused pixel size.
     * On screen each tile is then a single bitmap, which the TV's GPU moves and scales without effort.
     */
    private Bitmap tileBitmap(App a) {
        // exactly the tile's size on screen: at rest every picture pixel lands on one screen pixel
        final int W = dp(TILE_W), H = dp(TILE_H);
        final float r = dp(18), line = Math.max(1f, dp(1));
        try {
            Bitmap content = a.banner != null ? sharpBanner(a.banner, W, H) : null;
            if (content == null) {
                content = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
                Canvas cc = new Canvas(content);
                Paint f = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
                if (a.cardBg != null) {
                    cc.drawBitmap(a.cardBg, null, new Rect(0, 0, W, H), f);
                } else {
                    f.setShader(new android.graphics.LinearGradient(0, 0, W, H, lighten(a.color, 0.18f),
                            darken(a.color, 0.5f), Shader.TileMode.CLAMP));
                    cc.drawRect(0, 0, W, H, f);
                    f.setShader(null);
                }
                Paint halo = new Paint(Paint.ANTI_ALIAS_FLAG);
                halo.setShader(new RadialGradient(W / 2f, H / 2f, H * 0.62f, 0x59000000, 0x00000000, Shader.TileMode.CLAMP));
                cc.drawRect(0, 0, W, H, halo);
                int s = Math.round(H * 0.56f);
                if (a.icon != null && a.icon.getConstantState() != null) {
                    Drawable d = a.icon.getConstantState().newDrawable().mutate();
                    if (d instanceof BitmapDrawable) ((BitmapDrawable) d).setFilterBitmap(true);
                    d.setBounds(W / 2 - s / 2, H / 2 - s / 2, W / 2 + s / 2, H / 2 + s / 2);
                    d.draw(cc);
                } else {
                    Paint t = new Paint(Paint.ANTI_ALIAS_FLAG);
                    t.setColor(Color.WHITE);
                    t.setTextSize(H * 0.34f);
                    t.setTypeface(Typeface.create("sans-serif-black", Typeface.NORMAL));
                    t.setTextAlign(Paint.Align.CENTER);
                    cc.drawText(a.label.substring(0, Math.min(2, a.label.length())), W / 2f, H / 2f + H * 0.12f, t);
                }
            }
            Bitmap out = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(out);
            android.graphics.RectF box = new android.graphics.RectF(0, 0, W, H);
            Paint pic = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
            pic.setShader(new android.graphics.BitmapShader(content, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP));
            c.drawRoundRect(box, r, r, pic);
            Paint sheen = new Paint(Paint.ANTI_ALIAS_FLAG);
            sheen.setShader(new android.graphics.LinearGradient(0, 0, W * 0.55f, H, 0x24FFFFFF, 0x00FFFFFF, Shader.TileMode.CLAMP));
            c.drawRoundRect(box, r, r, sheen);
            Paint rim = new Paint(Paint.ANTI_ALIAS_FLAG);
            rim.setStyle(Paint.Style.STROKE);
            rim.setStrokeWidth(line);
            rim.setColor(0x4DFFFFFF);
            c.drawRoundRect(new android.graphics.RectF(line / 2, line / 2, W - line / 2, H - line / 2), r, r, rim);
            rim.setColor(0x2E000000);
            c.drawRoundRect(new android.graphics.RectF(line * 1.5f, line * 1.5f, W - line * 1.5f, H - line * 1.5f),
                    r - line, r - line, rim);
            if (content != a.cardBg) content.recycle();
            return out;
        } catch (RuntimeException | OutOfMemoryError e) {
            return null;
        }
    }

    private final Map<Integer, Bitmap> glowCache = new HashMap<>();

    /** A small soft spot in the app's colour; stretched behind the focused card it reads as a glow. */
    private Bitmap glowSpot(int color) {
        Bitmap b = glowCache.get(color);
        if (b != null) return b;
        int n = 48;
        b = Bitmap.createBitmap(n, n, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        int r = Color.red(color), g = Color.green(color), bl = Color.blue(color);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setShader(new RadialGradient(n / 2f, n / 2f, n / 2f,
                new int[]{Color.argb(200, r, g, bl), Color.argb(90, r, g, bl), Color.argb(0, r, g, bl)},
                new float[]{0f, 0.55f, 1f}, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, n, n, p);
        glowCache.put(color, b);
        return b;
    }

    private View tile(final App a) {
        final int w = dp(TILE_W), h = dp(TILE_H), gap = dp(24);
        final LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);
        box.setClipChildren(false);
        box.setFocusable(true);
        box.setTag(a);
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(w, -2);
        blp.rightMargin = gap;
        box.setLayoutParams(blp);

        final FrameLayout card = new FrameLayout(this);
        card.setClipChildren(false);

        // focus highlight (alpha only, so it costs nothing to animate): soft light, then a wider frosted
        // glass frame around the card, then the white ring on the card itself
        final View focusFx = new FrameLayout(this);
        // Fading this group must not go through an offscreen buffer the size of the card: that buffer would
        // cut the glow and the glass frame (which reach outside the card) into a sharp-cornered rectangle.
        focusFx.forceHasOverlappingRendering(false);
        ((FrameLayout) focusFx).setClipChildren(false);
        focusFx.setAlpha(0f);
        ImageView light = new ImageView(this);
        light.setImageBitmap(glowSpot(lighten(a.color, 0.55f)));
        light.setScaleType(ImageView.ScaleType.FIT_XY);
        light.setAlpha(0.55f);
        int g = dp(34);
        FrameLayout.LayoutParams glp = new FrameLayout.LayoutParams(w + 2 * g, h + 2 * g);
        glp.setMargins(-g, -g, -g, -g);
        ((FrameLayout) focusFx).addView(light, glp);
        View halo = new View(this);
        GradientDrawable haloD = new GradientDrawable();
        haloD.setCornerRadius(dp(18) + dp(10));
        haloD.setColor(0x1FFFFFFF);
        haloD.setStroke(Math.max(1, dp(1)), 0x4DFFFFFF);
        halo.setBackground(haloD);
        int hg = dp(10);
        FrameLayout.LayoutParams hlp = new FrameLayout.LayoutParams(w + 2 * hg, h + 2 * hg);
        hlp.setMargins(-hg, -hg, -hg, -hg);
        ((FrameLayout) focusFx).addView(halo, hlp);
        card.addView(focusFx, new FrameLayout.LayoutParams(w, h));

        final ImageView image = new ImageView(this);
        image.setScaleType(ImageView.ScaleType.FIT_XY);
        if (a.tile != null) {
            image.setImageBitmap(a.tile);
        } else {
            GradientDrawable fallback = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                    new int[]{lighten(a.color, 0.18f), darken(a.color, 0.5f)});
            fallback.setCornerRadius(dp(18));
            image.setImageDrawable(fallback);
        }
        image.setAlpha(0.86f);
        card.addView(image, new FrameLayout.LayoutParams(w, h));


        box.addView(card, new LinearLayout.LayoutParams(w, h));

        final TextView label = text(14, Color.WHITE, Typeface.create("sans-serif-medium", Typeface.NORMAL));
        label.setText(a.label);
        label.setSingleLine(true);
        label.setEllipsize(TextUtils.TruncateAt.END);
        label.setGravity(Gravity.CENTER);
        label.setAlpha(0.55f);
        LinearLayout.LayoutParams llp = new LinearLayout.LayoutParams(-1, dp(20));
        llp.topMargin = dp(14);
        box.addView(label, llp);

        final float lift = dp(5);
        box.setOnFocusChangeListener((v, has) -> {
            card.animate().cancel();
            card.animate().scaleX(has ? FOCUS_SCALE : 1f).scaleY(has ? FOCUS_SCALE : 1f)
                    .translationY(has ? -lift : 0f).setDuration(360).setInterpolator(EASE).start();
            image.animate().alpha(has ? 1f : 0.86f).setDuration(360).setInterpolator(EASE).start();
            focusFx.animate().alpha(has ? 1f : 0f).setDuration(320).setInterpolator(EASE).start();
            label.animate().alpha(has ? 1f : 0.55f).translationY(has ? lift : 0f).setDuration(360)
                    .setInterpolator(EASE).start();
            if (has) {
                showHero(a);
                int index = row.indexOfChild(v);
                glideTo(index <= 0 ? 0 : v.getLeft() - (w + gap) + dp(4) - row.getPaddingLeft());
            }
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

    /** New title and text slide up into place; the colour glow follows once the remote settles. */
    private void showHero(App a) {
        if (a == heroApp) return;
        heroApp = a;
        String cat = CATEGORY_TITLE.get(a.category);
        heroCategory.setText(cat == null ? "" : cat);
        heroTitle.setText(a.label);
        heroDesc.setText(describe(a));
        heroTitle.animate().cancel();
        heroDesc.animate().cancel();
        heroTitle.setAlpha(0.15f);
        heroTitle.setTranslationX(dp(14));
        heroDesc.setAlpha(0f);
        heroTitle.animate().alpha(1f).translationX(0f).setDuration(380).setInterpolator(EASE).start();
        heroDesc.animate().alpha(1f).setStartDelay(60).setDuration(380).setInterpolator(EASE).start();
        tintFor(a);
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
            renderRow(true);
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
        int h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        greeting.setText(h < 5 ? "ДОБРОЙ НОЧИ" : h < 12 ? "ДОБРОЕ УТРО" : h < 18 ? "ДОБРЫЙ ДЕНЬ" : h < 23 ? "ДОБРЫЙ ВЕЧЕР" : "ДОБРОЙ НОЧИ");
    }
}
