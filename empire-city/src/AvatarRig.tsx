import { useId } from "react";
import type { Equipment } from "./equipment";
import {
  avatarFrame,
  avatarDrawOrder,
  visualAssets,
  type VisualAssetId,
} from "./avatarAssets";
const ink = "#1b272d";
type Palette = { id: string };
function Arm({ id }: Palette) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M93 171C76 181 70 236 64 279L48 342Q42 355 46 373L51 384Q56 392 62 388L67 379Q74 374 71 360L68 348 84 285C98 244 106 203 113 183Z"
        fill={`url(#${id}-skin)`}
      />
      <path
        d="M79 228Q74 262 71 281L57 345"
        fill="none"
        stroke="#b67c60"
        strokeWidth="4"
      />
      <path
        d="M50 357L53 378M57 360L60 382M64 359L65 375"
        fill="none"
        stroke="#a7755e"
        strokeWidth="1.8"
      />
      <path
        d="M91 185Q84 208 82 223"
        stroke="#f4cfa5"
        strokeWidth="3"
        fill="none"
      />
    </g>
  );
}
function Skin({ id }: Palette) {
  return (
    <g>
      <path
        d="M140 119Q160 130 180 119L183 155 198 166Q161 191 122 166L138 151Z"
        fill={`url(#${id}-skin)`}
        stroke={ink}
        strokeWidth="3"
      />
      <path
        d="M144 131Q159 149 177 132L179 151Q160 163 140 151Z"
        fill="#be886c"
        opacity=".6"
      />
      <Arm id={id} />
      <g transform="translate(320 0) scale(-1 1)">
        <Arm id={id} />
      </g>
    </g>
  );
}
function Pants({
  id,
  formal = false,
  cargo = false,
  neutral = false,
}: Palette & { cargo?: boolean; neutral?: boolean; formal?: boolean }) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M104 339Q160 354 216 339L224 409 219 474 227 571Q210 581 187 574L169 430 160 389 151 430 133 574Q112 581 93 571L101 474 96 409Z"
        fill={`url(#${id}-${neutral ? "neutral" : formal ? "formal" : cargo ? "cargo" : "denim"})`}
      />
      <path
        d="M106 349Q160 361 213 349L213 367Q160 378 105 366Z"
        fill={cargo ? "#44533f" : neutral ? "#35424b" : "#304760"}
      />
      <path
        d="M160 363L160 391M108 365Q111 388 132 388M211 365Q210 388 189 388"
        stroke={cargo ? "#a2ad86" : "#91a0aa"}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M111 406L117 464 107 549M206 406L201 465 215 550"
        stroke="#13212a"
        strokeWidth="5"
        opacity=".28"
        fill="none"
      />
      <path
        d="M143 433L132 553M177 433L189 554"
        stroke={cargo ? "#899677" : "#6c8498"}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M96 565L132 568M188 568L224 565"
        stroke={cargo ? "#a6ae88" : "#91a1ac"}
        strokeWidth="2"
      />
      {formal && (
        <path
          d="M129 397L114 552M191 397L207 552"
          stroke="#82908c"
          opacity=".6"
          strokeWidth="1.4"
          fill="none"
        />
      )}
      {cargo ? (
        <>
          <path
            d="M100 422L133 424 131 472 98 471ZM187 424L220 422 222 471 189 472Z"
            fill="#5c6a51"
          />
          <path
            d="M99 421L134 423 132 436 100 437ZM186 423L221 421 220 437 188 436Z"
            fill="#829073"
          />
          <path
            d="M108 451L123 452M197 452L213 451"
            stroke="#9ba787"
            strokeWidth="1.7"
          />
          <circle cx="116" cy="430" r="2" fill="#bec7a0" />
          <circle cx="204" cy="430" r="2" fill="#bec7a0" />
        </>
      ) : (
        <>
          <path
            d="M109 352L107 366M137 357L137 371M183 357L183 371M211 352L213 366"
            stroke="#7590a4"
            strokeWidth="4"
          />
          <circle cx="159" cy="366" r="2.4" fill="#c9b78e" />
        </>
      )}
    </g>
  );
}
function Shoe({ id, neutral = false }: Palette & { neutral?: boolean }) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M95 562L128 562 133 579Q145 590 140 605L136 613 83 613Q77 606 81 596L91 580Z"
        fill={`url(#${id}-${neutral ? "darkshoe" : "shoe"})`}
      />
      <path
        d="M83 599Q112 603 140 599L138 612 82 614Z"
        fill={neutral ? "#68746e" : "#bcc8c5"}
      />
      <path
        d="M100 575L125 576 130 591 93 591Z"
        fill={neutral ? "#42515a" : "#dce4db"}
      />
      <path
        d="M99 578L124 582M97 584L126 587M93 591Q111 595 130 590"
        stroke={neutral ? "#859a9d" : "#71888e"}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M85 605L136 605"
        stroke={neutral ? "#b0bbb0" : "#f8f8e7"}
        strokeWidth="2"
      />
      <path
        d="M92 595L87 600M131 594L136 599"
        stroke={neutral ? "#9ba89e" : "#80989b"}
        strokeWidth="1.5"
      />
    </g>
  );
}
function Shoes({ id, neutral = false }: Palette & { neutral?: boolean }) {
  return (
    <g>
      <Shoe id={id} neutral={neutral} />
      <g transform="translate(320 0) scale(-1 1)">
        <Shoe id={id} neutral={neutral} />
      </g>
    </g>
  );
}
function Tee({ id, neutral = false }: Palette & { neutral?: boolean }) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M138 151Q160 163 182 151 210 153 231 169L250 232 218 247 208 218 220 350Q160 368 100 350L112 218 102 247 70 232 89 169Q112 153 138 151Z"
        fill={`url(#${id}-${neutral ? "white" : "tee"})`}
      />
      <path
        d="M138 152Q160 176 182 152L189 156Q162 185 131 156Z"
        fill={neutral ? "#c5d0c9" : "#16282e"}
      />
      <path
        d="M89 175L79 227M232 175L242 227"
        stroke={neutral ? "#fcf4d9" : "#6a7c7f"}
        strokeWidth="3"
      />
      <path
        d="M115 223L110 263 120 285M205 223L210 263 200 285M105 338Q160 351 215 338"
        fill="none"
        stroke={neutral ? "#a8b5b0" : "#101e28"}
        strokeWidth="3"
        opacity=".75"
      />
      <path
        d="M134 192Q127 240 135 285M173 193L180 257"
        stroke={neutral ? "#fffbec" : "#7b8e8e"}
        strokeWidth="4"
        opacity=".2"
        fill="none"
      />
      <path
        d="M74 232L101 243M219 243L246 232"
        stroke={neutral ? "#b2bfb7" : "#849293"}
        strokeWidth="1.8"
      />
    </g>
  );
}
function HoodieSleeve({ id }: Palette) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M105 158Q83 162 75 185L62 241 44 337Q50 350 74 351L91 301 112 233Z"
        fill={`url(#${id}-hoodie)`}
      />
      <path d="M48 332Q58 342 77 340L74 355 44 348Z" fill="#35474d" />
      <path
        d="M81 190L70 238M68 266L81 279 66 284M58 310L72 315M48 343L72 349"
        fill="none"
        stroke="#82908e"
        strokeWidth="2"
      />
      <path
        d="M89 181L77 238 70 253"
        stroke="#a0aba1"
        strokeWidth="3"
        opacity=".5"
        fill="none"
      />
    </g>
  );
}
function Hoodie({ id }: Palette) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <HoodieSleeve id={id} />
      <g transform="translate(320 0) scale(-1 1)">
        <HoodieSleeve id={id} />
      </g>
      <path
        d="M136 149L114 160 104 236 99 351Q161 367 221 351L216 236 206 160 184 149Z"
        fill={`url(#${id}-hoodie)`}
      />
      <path
        d="M144 157L136 349 184 349 176 157Q161 171 144 157Z"
        fill="#253e36"
      />
      <path
        d="M136 151L120 169 139 201 151 178 144 157M184 151L200 169 181 201 169 178 176 157"
        fill="#73817d"
      />
      <path
        d="M135 151Q126 139 137 131L153 135Q161 141 169 135L182 131Q196 139 185 151L175 171 160 164 145 171Z"
        fill="#46585c"
      />
      <path
        d="M139 145Q158 158 182 145"
        stroke="#9aa39a"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M139 188L132 235M181 188L188 235"
        stroke="#bdc2af"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M131 230L130 240M189 230L190 240"
        stroke="#dce0c8"
        strokeWidth="3"
      />
      <path
        d="M133 240L126 347M187 240L194 347"
        stroke="#c4c7b3"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M113 282L132 278 129 326 108 326ZM188 278L207 282 212 326 191 326Z"
        fill="#3e5256"
      />
      <path
        d="M109 327L128 327M192 327L211 327M102 347Q161 361 218 347"
        fill="none"
        stroke="#8d9b94"
        strokeWidth="2"
      />
    </g>
  );
}
function Cap({ id }: Palette) {
  return (
    <g stroke={ink} strokeWidth="3" strokeLinejoin="round">
      <path
        d="M113 49Q113 15 151 14L169 14Q206 20 208 49L194 59 125 59Z"
        fill={`url(#${id}-cap)`}
      />
      <path
        d="M157 16L159 47M121 45Q160 36 203 47"
        stroke="#7d9191"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M113 46Q157 38 206 47L223 58Q205 69 172 63L108 61Q101 56 113 46Z"
        fill="#3e555b"
      />
      <path
        d="M110 57Q163 48 214 58"
        stroke="#8da2a0"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M149 29L166 29 166 37 149 37Z"
        fill="#b2bdac"
        strokeWidth="1.7"
      />
    </g>
  );
}
function Glove({ id }: Palette) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M47 345L71 348 73 361Q81 361 82 370L77 385Q69 397 55 395L42 387Q36 378 40 367L44 360Z"
        fill={`url(#${id}-glove)`}
      />
      <path d="M46 344L72 347 72 357 43 353Z" fill="#526569" />
      <path
        d="M45 367Q61 358 75 367M42 378Q59 370 78 377"
        stroke="#819395"
        strokeWidth="2"
        fill="none"
      />
      <path d="M75 365Q85 371 75 383L68 382 69 372Z" fill="#42575d" />
      <path d="M47 349L67 352" stroke="#b0bdb3" strokeWidth="2" />
    </g>
  );
}
function Gloves({ id }: Palette) {
  return (
    <g>
      <Glove id={id} />
      <g transform="translate(320 0) scale(-1 1)">
        <Glove id={id} />
      </g>
    </g>
  );
}

/** Long coat follows the same shoulders and cuffs; its tails overlap the trousers. */
function CoatSleeve({ id }: Palette) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M111 156Q85 158 76 186L62 245 43 337Q51 351 76 351L91 301 111 238 121 185Z"
        fill={`url(#${id}-coat)`}
      />
      <path d="M48 331Q60 340 78 338L75 353 44 347Z" fill="#263932" />
      <path
        d="M98 169Q87 186 82 216L72 245M68 265L80 276 68 282M59 311L73 315"
        stroke="#7e9080"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M76 207L63 260 51 322"
        stroke="#132821"
        strokeWidth="5"
        opacity=".5"
        fill="none"
      />
      <path d="M51 342L72 348" stroke="#b2aa80" strokeWidth="1.4" />
      <circle cx="59" cy="342" r="2.2" fill="#d1b875" />
    </g>
  );
}
function Coat({ id }: Palette) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <CoatSleeve id={id} />
      <g transform="translate(320 0) scale(-1 1)">
        <CoatSleeve id={id} />
      </g>
      <path
        d="M136 149L112 161 99 246 88 490Q108 503 144 493L160 386 176 493Q211 503 232 490L221 246 208 161 184 149Z"
        fill={`url(#${id}-coat)`}
      />
      <path
        d="M139 156L121 250 128 350 160 373 192 350 199 250 181 156Z"
        fill={`url(#${id}-vest)`}
      />
      <path d="M139 152L160 165 181 152 176 214 144 214Z" fill="#ccd4c5" />
      <path
        d="M139 152L160 165 148 180 136 163ZM181 152L160 165 172 180 184 163Z"
        fill="#e6e3cf"
        strokeWidth="2"
      />
      <path
        d="M143 181L160 224 177 181 184 283 178 348 160 363 142 348 136 283Z"
        fill={`url(#${id}-vest)`}
      />
      <path
        d="M137 151L116 163 108 192 125 190 117 207 143 274 148 228ZM183 151L204 163 212 192 195 190 203 207 177 274 172 228Z"
        fill="#53675a"
      />
      <path
        d="M125 193L145 250M195 193L175 250"
        stroke="#87927c"
        strokeWidth="1.7"
        fill="none"
      />
      <path
        d="M143 274L132 485M177 274L188 485M107 287L100 475M213 287L220 475"
        stroke="#152d25"
        opacity=".7"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M111 303L132 299 130 309 109 315ZM188 299L209 303 211 315 190 309Z"
        fill="#20372e"
      />
      <path
        d="M103 481Q120 487 137 481M183 481Q202 487 223 481"
        stroke="#71836e"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M151 242L150 335M169 242L170 335"
        stroke="#66766f"
        strokeWidth="1.5"
        fill="none"
      />
      {[259, 283, 307, 331].map((y) => (
        <circle
          key={y}
          cx="160"
          cy={y}
          r="2.5"
          fill="#b7aa7e"
          strokeWidth="1.2"
        />
      ))}
      <path
        d="M143 166Q160 204 177 166"
        stroke="#775321"
        strokeWidth="7"
        fill="none"
      />
      <path
        d="M143 166Q160 204 177 166"
        stroke="#e7bb53"
        strokeWidth="4.5"
        strokeDasharray="2 3"
        fill="none"
      />
      <path
        d="M160 192L160 208M155 200L165 200"
        stroke="#f0c86b"
        strokeWidth="4"
      />
      <path
        d="M203 254L194 290 186 283"
        stroke="#798d7b"
        strokeWidth="1.8"
        fill="none"
      />
    </g>
  );
}
function FormalShoe({ id }: Palette) {
  return (
    <g
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M95 563L128 563 131 581Q142 591 141 604L137 613 83 613Q77 609 81 598L91 582Z"
        fill={`url(#${id}-leather)`}
      />
      <path d="M82 605Q111 611 140 604L138 613 82 615Z" fill="#121d21" />
      <path d="M99 573L124 575 131 593Q114 587 91 594Z" fill="#293c3e" />
      <path
        d="M98 578L125 582M96 583L127 587M89 595Q112 589 133 596"
        stroke="#84918a"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M85 600Q103 596 115 599M119 571L124 574"
        stroke="#b1bcb0"
        strokeWidth="2.4"
        opacity=".65"
        fill="none"
      />
      <path
        d="M88 609Q111 614 135 609"
        stroke="#757f70"
        strokeWidth="1.2"
        fill="none"
      />
    </g>
  );
}
function FormalShoes({ id }: Palette) {
  return (
    <g>
      <FormalShoe id={id} />
      <g transform="translate(320 0) scale(-1 1)">
        <FormalShoe id={id} />
      </g>
    </g>
  );
}
function Fedora({ id }: Palette) {
  return (
    <g
      transform="translate(0 -7)"
      stroke={ink}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M112 47L121 16Q127 7 141 15L157 18 177 10Q188 6 193 21L205 49Z"
        fill={`url(#${id}-coat)`}
      />
      <path
        d="M123 19L138 26 160 29 181 20"
        stroke="#8c9985"
        strokeWidth="2"
        fill="none"
      />
      <path d="M113 42Q160 49 202 40L206 52Q161 61 110 53Z" fill="#152922" />
      <path
        d="M110 47Q154 61 206 46L225 54Q222 66 191 67L105 64Q89 62 96 55Z"
        fill="#435c4f"
      />
      <path
        d="M100 56Q156 69 219 56"
        stroke="#a1aa91"
        strokeWidth="1.8"
        fill="none"
      />
    </g>
  );
}
export function Wearable({
  assetId,
  id,
}: {
  assetId: VisualAssetId;
  id: string;
}) {
  const kind = visualAssets[assetId].kind;
  if (kind === "coat") return <Coat id={id} />;
  if (kind === "trousers") return <Pants id={id} formal />;
  if (kind === "oxfords") return <FormalShoes id={id} />;
  if (kind === "fedora") return <Fedora id={id} />;
  if (kind === "tee") return <Tee id={id} />;
  if (kind === "hoodie") return <Hoodie id={id} />;
  if (kind === "jeans" || kind === "cargo")
    return <Pants id={id} cargo={kind === "cargo"} />;
  if (kind === "sneakers") return <Shoes id={id} />;
  if (kind === "cap") return <Cap id={id} />;
  return <Gloves id={id} />;
}
function Defs({
  id,
  skin = ["#f4c59e", "#e4ac83", "#ba7e63"],
}: Palette & { skin?: readonly string[] }) {
  return (
    <defs>
      <linearGradient id={id + "-coat"} x1="0" x2="1" y2=".15">
        <stop stopColor="#64786a" />
        <stop offset=".25" stopColor="#3c5448" />
        <stop offset=".62" stopColor="#263d33" />
        <stop offset="1" stopColor="#182d26" />
      </linearGradient>
      <linearGradient id={id + "-formal"} x1="0" x2="1" y2=".2">
        <stop stopColor="#657168" />
        <stop offset=".4" stopColor="#46534f" />
        <stop offset=".7" stopColor="#303e3e" />
        <stop offset="1" stopColor="#263533" />
      </linearGradient>
      <linearGradient id={id + "-vest"} x1="0" x2="1" y2=".3">
        <stop stopColor="#58625b" />
        <stop offset=".45" stopColor="#303f3a" />
        <stop offset="1" stopColor="#1d2d28" />
      </linearGradient>
      <linearGradient id={id + "-leather"} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#6d8078" />
        <stop offset=".35" stopColor="#304847" />
        <stop offset=".7" stopColor="#17292d" />
        <stop offset="1" stopColor="#0b181e" />
      </linearGradient>
      <linearGradient id={id + "-skin"} x1="0" y1="0" x2="1" y2=".5">
        <stop stopColor={skin[0]} />
        <stop offset=".45" stopColor={skin[1]} />
        <stop offset="1" stopColor={skin[2]} />
      </linearGradient>
      <linearGradient id={id + "-tee"} x1="0" x2="1" y2=".3">
        <stop stopColor="#53666a" />
        <stop offset=".3" stopColor="#34454c" />
        <stop offset=".65" stopColor="#24353e" />
        <stop offset="1" stopColor="#1b2c35" />
      </linearGradient>
      <linearGradient id={id + "-white"} x1="0" x2="1" y2=".3">
        <stop stopColor="#fff1d2" />
        <stop offset=".45" stopColor="#e1e3d8" />
        <stop offset="1" stopColor="#acbbb4" />
      </linearGradient>
      <linearGradient id={id + "-hoodie"} x1="0" x2="1" y2=".2">
        <stop stopColor="#8a9996" />
        <stop offset=".28" stopColor="#63777b" />
        <stop offset=".65" stopColor="#475e66" />
        <stop offset="1" stopColor="#344b55" />
      </linearGradient>
      <linearGradient id={id + "-denim"} x1="0" x2="1" y2=".2">
        <stop stopColor="#6b8594" />
        <stop offset=".4" stopColor="#4a6681" />
        <stop offset=".68" stopColor="#354e69" />
        <stop offset="1" stopColor="#2c4057" />
      </linearGradient>
      <linearGradient id={id + "-cargo"} x1="0" x2="1" y2=".2">
        <stop stopColor="#98a283" />
        <stop offset=".4" stopColor="#718366" />
        <stop offset=".7" stopColor="#576b50" />
        <stop offset="1" stopColor="#3d523f" />
      </linearGradient>
      <linearGradient id={id + "-neutral"} x1="0" x2="1" y2=".3">
        <stop stopColor="#626d73" />
        <stop offset=".5" stopColor="#46545e" />
        <stop offset="1" stopColor="#303e49" />
      </linearGradient>
      <linearGradient id={id + "-shoe"} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#fff6da" />
        <stop offset=".6" stopColor="#e1e8dd" />
        <stop offset="1" stopColor="#a5b6b6" />
      </linearGradient>
      <linearGradient id={id + "-darkshoe"} x1="0" x2="1" y2=".5">
        <stop stopColor="#657374" />
        <stop offset=".5" stopColor="#374c56" />
        <stop offset="1" stopColor="#253b46" />
      </linearGradient>
      <linearGradient id={id + "-cap"} x1="0" x2="1" y2=".3">
        <stop stopColor="#6d8183" />
        <stop offset=".5" stopColor="#3c535c" />
        <stop offset="1" stopColor="#233c47" />
      </linearGradient>
      <linearGradient id={id + "-glove"} x1="0" x2="1" y2=".3">
        <stop stopColor="#73898b" />
        <stop offset=".4" stopColor="#3f5861" />
        <stop offset="1" stopColor="#223d49" />
      </linearGradient>
      <clipPath id={id + "-head-clip"}>
        <rect x="99" y="49" width="124" height="108" />
      </clipPath>
    </defs>
  );
}
/** Every garment uses the same shoulders, waist, cuffs and ankles as the body. */
export function AvatarRig({
  equipment,
  headHref,
  onlyAsset,
  idPrefix,
  skin,
}: {
  equipment: Equipment;
  headHref?: string;
  onlyAsset?: VisualAssetId;
  idPrefix?: string;
  skin?: readonly string[];
}) {
  const unique = useId().replace(/:/g, "");
  const id = idPrefix ?? "rig" + unique;
  // Treat an unknown or incompatible visual exactly like an empty slot.
  const outfit = Object.fromEntries(
    avatarDrawOrder.map((slot) => {
      const item = equipment[slot];
      const asset = item && visualAssets[item.visualAssetId as VisualAssetId];
      return [slot, asset?.slot === slot ? item : null];
    }),
  ) as Equipment;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="avatar-rig"
      viewBox={`0 0 ${avatarFrame.width} ${avatarFrame.height}`}
      preserveAspectRatio="xMidYMid meet"
      role={onlyAsset ? undefined : "img"}
      aria-label={
        onlyAsset
          ? undefined
          : "Рисованный персонаж с аккуратно надетой экипировкой"
      }
    >
      <Defs id={id} skin={skin} />
      {onlyAsset ? (
        <Wearable assetId={onlyAsset} id={id} />
      ) : (
        <>
          <g data-slot="base">
            <ellipse
              cx="160"
              cy="618"
              rx="91"
              ry="12"
              fill="#091a1f"
              opacity=".24"
            />
            <Skin id={id} />
            {!outfit.legs && (
              <g data-base-clothing="legs">
                <Pants id={id} neutral />
              </g>
            )}
            {!outfit.feet && (
              <g data-base-clothing="feet">
                <Shoes id={id} neutral />
              </g>
            )}
            {headHref && (
              <image
                data-part="face"
                x="104"
                y="9"
                width="112"
                height="144"
                href={headHref}
                preserveAspectRatio="xMidYMax meet"
                clipPath={outfit.head ? `url(#${id}-head-clip)` : undefined}
              />
            )}
            <path
              d="M139 154Q159 173 182 154"
              stroke={ink}
              strokeWidth="3"
              fill="none"
            />
            {!outfit.chest && (
              <g data-base-clothing="chest">
                <Tee id={id} neutral />
              </g>
            )}
          </g>
          {avatarDrawOrder.map((slot) => {
            const item = outfit[slot];
            if (!item) return null;
            const asset = visualAssets[item.visualAssetId as VisualAssetId];
            if (!asset || asset.slot !== slot) return null;
            return (
              <g
                key={slot}
                data-slot={slot}
                data-visual-asset={item.visualAssetId}
              >
                <Wearable
                  assetId={item.visualAssetId as VisualAssetId}
                  id={id}
                />
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}
