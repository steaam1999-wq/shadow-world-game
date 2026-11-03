package com.ymusic.tv;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.TransitionDrawable;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.view.animation.PathInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * The app's own start screen: big native tiles for the main sections and a «Сейчас играет» bar with the
 * cover and the player's buttons. Everything here is plain views (fast on the TV); a tile hands the
 * chosen section to the web player behind it, which keeps playing while this screen is shown.
 */
final class HomeMenu extends FrameLayout {

    static final PathInterpolator EASE = new PathInterpolator(0.2f, 0f, 0f, 1f);

    private final MainActivity app;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService net = Executors.newSingleThreadExecutor();
    private final List<View> tiles = new ArrayList<>();
    private final View glow;
    private Drawable currentGlow;
    private final TextView clock, npTitle, npArtist;
    private final ImageView cover, playBtn;
    private String coverUrl = "";
    private int glowColor = 0xFFFFB02E;
    private View lastFocus;
    private boolean polling;

    HomeMenu(MainActivity a) {
        super(a);
        app = a;
        setBackgroundColor(0xFF0D0E13);
        setClickable(true);

        glow = new View(a);
        currentGlow = glowFor(glowColor);
        glow.setBackground(currentGlow);
        addView(glow, new LayoutParams(-1, -1));

        LinearLayout content = new LinearLayout(a);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(48), dp(34), dp(48), dp(30));
        content.setClipChildren(false);
        content.setClipToPadding(false);
        addView(content, new LayoutParams(-1, -1));

        // header
        LinearLayout head = new LinearLayout(a);
        head.setGravity(Gravity.CENTER_VERTICAL);
        ImageView note = new ImageView(a);
        note.setImageResource(R.drawable.ic_note);
        GradientDrawable nb = new GradientDrawable();
        nb.setShape(GradientDrawable.OVAL);
        nb.setColor(0xFFFFCC33);
        note.setBackground(nb);
        note.setColorFilter(0xFF1A1206);
        note.setPadding(dp(8), dp(8), dp(8), dp(8));
        head.addView(note, new LinearLayout.LayoutParams(dp(40), dp(40)));
        TextView title = text(26, Color.WHITE, "sans-serif-black");
        title.setText("Яндекс Музыка");
        LinearLayout.LayoutParams tl = new LinearLayout.LayoutParams(0, -2, 1f);
        tl.leftMargin = dp(14);
        head.addView(title, tl);
        clock = text(30, 0xE6FFFFFF, "sans-serif-thin");
        head.addView(clock);
        content.addView(head);

        // row 1: Моя волна (wide), Мне нравится, Коллекция
        LinearLayout r1 = row(a, dp(168));
        r1.addView(tile(a, "Моя волна", "Бесконечный поток под ваш вкус", R.drawable.ic_wave,
                0xFFFFB02E, 0xFFFF5C39, true, v -> app.openSection("моя волна", "")), weight(2f, false));
        r1.addView(tile(a, "Мне нравится", "Ваши любимые треки", R.drawable.ic_heart,
                0xFFFF4D6D, 0xFF9B1D46, false, v -> app.openSection("мне нравится", "collection")), weight(1f, true));
        r1.addView(tile(a, "Коллекция", "Плейлисты, альбомы, артисты", R.drawable.ic_library,
                0xFF5B7CFF, 0xFF2A2F8F, false, v -> app.openSection("коллекция", "collection")), weight(1f, true));
        LinearLayout.LayoutParams r1p = new LinearLayout.LayoutParams(-1, dp(168));
        r1p.topMargin = dp(26);
        content.addView(r1, r1p);

        // row 2: Поиск, Чарт, Тренды, Подкасты и книги, Настройки
        LinearLayout r2 = row(a, dp(104));
        r2.addView(tile(a, "Поиск", null, R.drawable.ic_search, 0xFF3A3F55, 0xFF1D2030, false,
                v -> app.openSearch()), weight(1f, false));
        r2.addView(tile(a, "Чарт", null, R.drawable.ic_chart, 0xFF1FB57A, 0xFF0B5C40, false,
                v -> app.openSection("чарт", "chart")), weight(1f, true));
        r2.addView(tile(a, "Тренды", null, R.drawable.ic_star, 0xFFB45CFF, 0xFF5420A0, false,
                v -> app.openSection("тренды|новинки|новые релизы", "")), weight(1f, true));
        r2.addView(tile(a, "Подкасты и книги", null, R.drawable.ic_mic, 0xFF20B8D8, 0xFF0B5570, false,
                v -> app.openSection("подкаст|книг", "non-music")), weight(1f, true));
        r2.addView(tile(a, "Настройки", null, R.drawable.ic_tune, 0xFF555A68, 0xFF262932, false,
                v -> app.showSettingsDialog()), weight(1f, true));
        LinearLayout.LayoutParams r2p = new LinearLayout.LayoutParams(-1, dp(104));
        r2p.topMargin = dp(18);
        content.addView(r2, r2p);

        content.addView(new View(a), new LinearLayout.LayoutParams(1, 0, 1f));

        // «Сейчас играет»
        LinearLayout bar = new LinearLayout(a);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(14), dp(12), dp(18), dp(12));
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{0x2EFFFFFF, 0x12FFFFFF});
        bg.setCornerRadius(dp(22));
        bg.setStroke(Math.max(1, dp(1)), 0x33FFFFFF);
        bar.setBackground(bg);
        cover = new ImageView(a);
        cover.setScaleType(ImageView.ScaleType.CENTER_CROP);
        cover.setImageResource(R.drawable.ic_note);
        cover.setBackgroundColor(0x33FFFFFF);
        round(cover, dp(12));
        bar.addView(cover, new LinearLayout.LayoutParams(dp(68), dp(68)));
        LinearLayout texts = new LinearLayout(a);
        texts.setOrientation(LinearLayout.VERTICAL);
        TextView label = text(11, 0x99FFFFFF, "sans-serif-medium");
        label.setText("СЕЙЧАС ИГРАЕТ");
        label.setLetterSpacing(0.18f);
        npTitle = text(19, Color.WHITE, "sans-serif-medium");
        npTitle.setSingleLine(true);
        npTitle.setEllipsize(TextUtils.TruncateAt.END);
        npArtist = text(15, 0xB3FFFFFF, "sans-serif");
        npArtist.setSingleLine(true);
        npArtist.setEllipsize(TextUtils.TruncateAt.END);
        texts.addView(label);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(-1, -2);
        tp.topMargin = dp(4);
        texts.addView(npTitle, tp);
        LinearLayout.LayoutParams ap = new LinearLayout.LayoutParams(-1, -2);
        ap.topMargin = dp(2);
        texts.addView(npArtist, ap);
        LinearLayout.LayoutParams txp = new LinearLayout.LayoutParams(0, -2, 1f);
        txp.leftMargin = dp(16);
        bar.addView(texts, txp);
        bar.addView(roundButton(a, R.drawable.ic_prev, "Предыдущий трек", v -> app.media("previous")));
        playBtn = roundButton(a, R.drawable.ic_play, "Пауза / воспроизведение", v -> app.media("playpause"));
        bar.addView(playBtn);
        bar.addView(roundButton(a, R.drawable.ic_next, "Следующий трек", v -> app.media("next")));
        content.addView(bar, new LinearLayout.LayoutParams(-1, -2));

        showNothing();
    }

    // ---- building blocks -------------------------------------------------------------------------------

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private TextView text(float sp, int color, String face) {
        TextView t = new TextView(getContext());
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setTypeface(Typeface.create(face, Typeface.NORMAL));
        t.setIncludeFontPadding(false);
        return t;
    }

    private static LinearLayout row(MainActivity a, int h) {
        LinearLayout r = new LinearLayout(a);
        r.setOrientation(LinearLayout.HORIZONTAL);
        r.setClipChildren(false);
        return r;
    }

    private LinearLayout.LayoutParams weight(float w, boolean gap) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, -1, w);
        if (gap) p.leftMargin = dp(16);
        return p;
    }

    private void round(View v, final float r) {
        v.setOutlineProvider(new ViewOutlineProvider() {
            @Override public void getOutline(View view, Outline o) {
                o.setRoundRect(0, 0, view.getWidth(), view.getHeight(), r);
            }
        });
        v.setClipToOutline(true);
    }

    /** A section card: colour gradient, a big icon, the name (and a line of text on the big ones). */
    private View tile(MainActivity a, String name, String sub, int icon, int c1, int c2, boolean big,
                      View.OnClickListener click) {
        FrameLayout t = new FrameLayout(a);
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[]{c1, c2});
        g.setCornerRadius(dp(22));
        t.setBackground(g);
        t.setFocusable(true);
        t.setClipChildren(false);
        // glass sheen
        View sheen = new View(a);
        GradientDrawable sh = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                new int[]{0x33FFFFFF, 0x00FFFFFF, 0x00FFFFFF});
        sh.setCornerRadius(dp(22));
        sheen.setBackground(sh);
        t.addView(sheen, new LayoutParams(-1, -1));

        ImageView ic = new ImageView(a);
        ic.setImageResource(icon);
        ic.setAlpha(big ? 0.95f : 0.9f);
        int s = big ? dp(54) : dp(34);
        LayoutParams ip = new LayoutParams(s, s, Gravity.TOP | Gravity.START);
        ip.setMargins(dp(20), dp(18), 0, 0);
        t.addView(ic, ip);

        LinearLayout words = new LinearLayout(a);
        words.setOrientation(LinearLayout.VERTICAL);
        TextView n = text(big ? 28 : 17, Color.WHITE, big ? "sans-serif-black" : "sans-serif-medium");
        n.setText(name);
        n.setSingleLine(true);
        n.setEllipsize(TextUtils.TruncateAt.END);
        words.addView(n);
        if (sub != null) {
            TextView st = text(14, 0xCCFFFFFF, "sans-serif");
            st.setText(sub);
            st.setSingleLine(true);
            st.setEllipsize(TextUtils.TruncateAt.END);
            LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-2, -2);
            sp.topMargin = dp(4);
            words.addView(st, sp);
        }
        LayoutParams wp = new LayoutParams(-1, -2, Gravity.BOTTOM | Gravity.START);
        wp.setMargins(dp(20), 0, dp(16), dp(16));
        t.addView(words, wp);

        // focus: a thin glass rim and a gentle lift
        final View rim = new View(a);
        GradientDrawable rd = new GradientDrawable();
        rd.setCornerRadius(dp(22));
        rd.setStroke(dp(2), 0xD9FFFFFF);
        rim.setBackground(rd);
        rim.setAlpha(0f);
        t.addView(rim, new LayoutParams(-1, -1));
        t.setOnFocusChangeListener((v, has) -> {
            v.animate().scaleX(has ? 1.05f : 1f).scaleY(has ? 1.05f : 1f).translationZ(has ? dp(8) : 0)
                    .setDuration(260).setInterpolator(EASE).start();
            rim.animate().alpha(has ? 1f : 0f).setDuration(200).setInterpolator(EASE).start();
            if (has) lastFocus = v;
        });
        t.setOnClickListener(click);
        tiles.add(t);
        return t;
    }

    private ImageView roundButton(MainActivity a, int icon, String name, View.OnClickListener click) {
        ImageView b = new ImageView(a);
        b.setImageResource(icon);
        b.setPadding(dp(14), dp(14), dp(14), dp(14));
        b.setContentDescription(name);
        GradientDrawable n = new GradientDrawable();
        n.setShape(GradientDrawable.OVAL);
        n.setColor(0x26FFFFFF);
        n.setStroke(Math.max(1, dp(1)), 0x40FFFFFF);
        GradientDrawable f = new GradientDrawable();
        f.setShape(GradientDrawable.OVAL);
        f.setColor(0xFFFFCC33);
        android.graphics.drawable.StateListDrawable st = new android.graphics.drawable.StateListDrawable();
        st.addState(new int[]{android.R.attr.state_focused}, f);
        st.addState(new int[]{}, n);
        b.setBackground(st);
        b.setFocusable(true);
        b.setOnFocusChangeListener((v, has) -> {
            ((ImageView) v).setColorFilter(has ? 0xFF1A1206 : Color.WHITE);
            v.animate().scaleX(has ? 1.1f : 1f).scaleY(has ? 1.1f : 1f).setDuration(220).setInterpolator(EASE).start();
            if (has) lastFocus = v;
        });
        b.setOnClickListener(v -> {
            click.onClick(v);
            ui.postDelayed(this::poll, 600);
        });
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(dp(56), dp(56));
        p.leftMargin = dp(12);
        b.setLayoutParams(p);
        return b;
    }

    // ---- background glow in the cover's colour ---------------------------------------------------------

    private Drawable glowFor(int color) {
        int r = Color.red(color), g = Color.green(color), b = Color.blue(color);
        GradientDrawable top = new GradientDrawable();
        top.setGradientType(GradientDrawable.RADIAL_GRADIENT);
        top.setColors(new int[]{Color.argb(120, r, g, b), Color.argb(40, r, g, b), Color.argb(0, r, g, b)});
        top.setGradientCenter(0.85f, 0.05f);
        top.setGradientRadius(dp(560));
        GradientDrawable low = new GradientDrawable();
        low.setGradientType(GradientDrawable.RADIAL_GRADIENT);
        low.setColors(new int[]{Color.argb(70, r, g, b), Color.argb(0, r, g, b)});
        low.setGradientCenter(0.1f, 1f);
        low.setGradientRadius(dp(420));
        return new LayerDrawable(new Drawable[]{new ColorDrawable(0xFF0D0E13), top, low});
    }

    private void tint(int color) {
        if (color == glowColor) return;
        glowColor = color;
        Drawable next = glowFor(color);
        TransitionDrawable t = new TransitionDrawable(new Drawable[]{currentGlow, next});
        t.setCrossFadeEnabled(false);
        glow.setBackground(t);
        t.startTransition(700);
        currentGlow = next;
    }

    // ---- show / hide, focus ----------------------------------------------------------------------------

    void onShown() {
        View f = lastFocus != null ? lastFocus : tiles.get(0);
        f.requestFocus();
        clock.setText(new SimpleDateFormat("HH:mm", new Locale("ru", "RU")).format(new Date()));
        if (!polling) {
            polling = true;
            pollLoop();
        }
    }

    void onHidden() {
        polling = false;
    }

    private void pollLoop() {
        if (!polling) return;
        poll();
        clock.setText(new SimpleDateFormat("HH:mm", new Locale("ru", "RU")).format(new Date()));
        ui.postDelayed(this::pollLoop, 2000);
    }

    // ---- «Сейчас играет» from the web player (Media Session metadata) ----------------------------------

    private void poll() {
        app.nowPlaying(json -> {
            try {
                String raw = new JSONArray("[" + json + "]").getString(0);   // evaluateJavascript quotes strings
                JSONObject o = new JSONObject(raw);
                String t = o.optString("t"), ar = o.optString("a"), art = o.optString("art"), st = o.optString("p");
                if (t.isEmpty()) {
                    showNothing();
                    return;
                }
                npTitle.setText(t);
                npArtist.setText(ar);
                playBtn.setImageResource("playing".equals(st) ? R.drawable.ic_pause : R.drawable.ic_play);
                if (!art.isEmpty() && !art.equals(coverUrl)) loadCover(art);
            } catch (Exception e) {
                showNothing();
            }
        });
    }

    private void showNothing() {
        npTitle.setText("Сейчас ничего не играет");
        npArtist.setText("Откройте «Мою волну» — и музыка начнётся");
        playBtn.setImageResource(R.drawable.ic_play);
    }

    private void loadCover(final String url) {
        coverUrl = url;
        net.execute(() -> {
            Bitmap bmp = null;
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(5000);
                c.setReadTimeout(5000);
                try (InputStream in = c.getInputStream()) {
                    bmp = BitmapFactory.decodeStream(in);
                }
            } catch (Exception ignored) {
                bmp = null;
            } finally {
                if (c != null) c.disconnect();
            }
            final Bitmap b = bmp;
            if (b == null) return;
            final int color = vivid(b);
            ui.post(() -> {
                if (!url.equals(coverUrl)) return;
                cover.setImageBitmap(b);
                tint(color);
            });
        });
    }

    /** The cover's most colourful average, for the background glow. */
    private static int vivid(Bitmap src) {
        Bitmap s = Bitmap.createScaledBitmap(src, 16, 16, true);
        long r = 0, g = 0, b = 0, n = 0;
        for (int y = 0; y < 16; y++) {
            for (int x = 0; x < 16; x++) {
                int p = s.getPixel(x, y);
                int pr = Color.red(p), pg = Color.green(p), pb = Color.blue(p);
                int max = Math.max(pr, Math.max(pg, pb)), min = Math.min(pr, Math.min(pg, pb));
                if (max - min > 40 && max > 60) { r += pr; g += pg; b += pb; n++; }
            }
        }
        if (n < 6) return 0xFFFFB02E;
        return Color.rgb((int) (r / n), (int) (g / n), (int) (b / n));
    }
}
