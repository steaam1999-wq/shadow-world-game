-- Все настройки баланса и монетизации в одном месте.
-- Меняйте цифры здесь — сервер и интерфейс подхватят их автоматически.
-- Баланс совпадает с браузерным прототипом (web-prototype/index.html).

local Config = {}

---------------------------------------------------------------------
-- Данные
---------------------------------------------------------------------
-- Если поменять имя — у всех игроков начнётся новый прогресс.
Config.DataStoreName = "ShadowWorld_PlayerData_v2"
Config.AutosaveInterval = 120 -- секунд

---------------------------------------------------------------------
-- Мир
---------------------------------------------------------------------
Config.World = {
	ZoneSize = 120, -- размер платформы зоны (studs)
	ZoneGap = 24, -- расстояние между зонами (там мост)
	RemoveDefaultBaseplate = true, -- удалить стандартный Baseplate шаблона
	ApplyLighting = true, -- ночная «теневая» атмосфера
}

-- price — цена открытия зоны, eggPrice — цена яйца питомца этой зоны.
-- shadowHp — здоровье тени, shadowValue — базовая награда.
-- ambient — эффект частиц зоны: fireflies, fog, embers, snow, void.
Config.Zones = {
	{
		name = "Сумеречный лес",
		price = 0,
		eggPrice = 200,
		shadowHp = 3,
		shadowValue = 1,
		floorColor = Color3.fromRGB(46, 58, 52),
		shadowColor = Color3.fromRGB(22, 16, 40),
		glowColor = Color3.fromRGB(160, 110, 255),
		ambient = "fireflies",
		ambientColor = Color3.fromRGB(210, 255, 130),
	},
	{
		name = "Туманные болота",
		price = 500,
		eggPrice = 2500,
		shadowHp = 12,
		shadowValue = 6,
		floorColor = Color3.fromRGB(44, 64, 68),
		shadowColor = Color3.fromRGB(16, 36, 44),
		glowColor = Color3.fromRGB(90, 225, 185),
		ambient = "fog",
		ambientColor = Color3.fromRGB(170, 235, 215),
	},
	{
		name = "Пепельные руины",
		price = 5000,
		eggPrice = 30000,
		shadowHp = 40,
		shadowValue = 25,
		floorColor = Color3.fromRGB(70, 46, 38),
		shadowColor = Color3.fromRGB(48, 16, 12),
		glowColor = Color3.fromRGB(255, 125, 60),
		ambient = "embers",
		ambientColor = Color3.fromRGB(255, 160, 70),
	},
	{
		name = "Ледяной склеп",
		price = 50000,
		eggPrice = 350000,
		shadowHp = 150,
		shadowValue = 120,
		floorColor = Color3.fromRGB(70, 90, 115),
		shadowColor = Color3.fromRGB(18, 30, 66),
		glowColor = Color3.fromRGB(135, 215, 255),
		ambient = "snow",
		ambientColor = Color3.fromRGB(235, 248, 255),
	},
	{
		name = "Бездна",
		price = 500000,
		eggPrice = 4000000,
		shadowHp = 600,
		shadowValue = 600,
		floorColor = Color3.fromRGB(34, 16, 50),
		shadowColor = Color3.fromRGB(56, 0, 88),
		glowColor = Color3.fromRGB(255, 80, 215),
		ambient = "void",
		ambientColor = Color3.fromRGB(255, 130, 245),
	},
}

---------------------------------------------------------------------
-- Тени
---------------------------------------------------------------------
Config.ShadowsPerZone = 8
Config.ShadowRespawnTime = 2.5 -- секунд
Config.ClickCooldown = 0.08 -- защита от автокликеров (секунд между ударами)
Config.ClickRange = 32 -- с какого расстояния можно кликнуть по тени
Config.AutoCatchInterval = 0.5 -- как часто бьёт авто-ловля (Game Pass)
Config.AutoCatchRange = 30
Config.SpiritInterval = 1 -- как часто стреляет дух-помощник
Config.SpiritRange = 40

-- Золотые тени: появляются случайно, быстрые и ценные.
Config.Golden = {
	spawnChance = 0.03,
	hpMultiplier = 2,
	rewardMultiplier = 10,
	gems = 1,
	xpMultiplier = 5,
}

-- Хранитель зоны: появляется, когда в зоне поймано N теней (всеми игроками сервера).
Config.Boss = {
	kills = 25,
	hpMultiplier = 50,
	duration = 60, -- секунд на победу
	rewardMultiplier = 60, -- награда каждому, кто нанёс урон
	gemsPerZone = 3,
	xpMultiplier = 25,
	retryKills = 15, -- если Хранитель ушёл, счётчик откатывается сюда
}

-- Комбо: быстрые удары подряд дают до +50% эссенции.
Config.Combo = {
	window = 0.8, -- секунд между ударами, чтобы комбо не сбросилось
	max = 50,
	perHit = 0.01,
}

function Config.ComboMultiplier(combo: number): number
	return 1 + math.min(combo, Config.Combo.max) * Config.Combo.perHit
end

---------------------------------------------------------------------
-- Характеристики (улучшения за эссенцию)
---------------------------------------------------------------------
Config.Upgrades = {
	power = {
		icon = "🔦",
		name = "Сила фонаря",
		description = "Больше урона за каждый удар",
		baseCost = 10,
		growth = 1.45,
		maxLevel = 300,
	},
	crit = {
		icon = "🎯",
		name = "Шанс крита",
		description = "Шанс нанести критический удар",
		baseCost = 60,
		growth = 1.75,
		maxLevel = 50,
	},
	critDamage = {
		icon = "💥",
		name = "Сила крита",
		description = "Во сколько раз крит сильнее",
		baseCost = 90,
		growth = 1.7,
		maxLevel = 40,
	},
	greed = {
		icon = "💰",
		name = "Жадность",
		description = "Больше эссенции за каждую тень",
		baseCost = 25,
		growth = 1.55,
		maxLevel = 200,
	},
	luck = {
		icon = "🍀",
		name = "Удача",
		description = "Шанс счастливой ловли: x10 эссенции и 💎",
		baseCost = 120,
		growth = 1.85,
		maxLevel = 30,
	},
	spirit = {
		icon = "✨",
		name = "Дух-помощник",
		description = "Питомцы сами атакуют ближайших теней",
		baseCost = 200,
		growth = 1.6,
		maxLevel = 150,
	},
	speed = {
		icon = "👟",
		name = "Теневой шаг",
		description = "Быстрее бег по миру",
		baseCost = 50,
		growth = 2.2,
		maxLevel = 10,
	},
}
Config.UpgradeOrder = { "power", "crit", "critDamage", "greed", "luck", "spirit", "speed" }

function Config.UpgradeCost(id: string, level: number): number
	local def = Config.Upgrades[id]
	return math.floor(def.baseCost * def.growth ^ level)
end

function Config.CritChance(level: number): number
	return math.min(0.55, 0.05 + 0.01 * level)
end

function Config.CritMultiplier(level: number): number
	return 2 + 0.25 * level
end

function Config.LuckyChance(level: number): number
	return 0.02 + 0.005 * level
end

function Config.GreedMultiplier(level: number): number
	return 1 + 0.1 * level
end

function Config.WalkSpeed(speedLevel: number, isVip: boolean): number
	return 16 + 2 * speedLevel + (if isVip then 4 else 0)
end

-- Короткое описание эффекта улучшения на уровне level (для интерфейса).
function Config.UpgradeEffect(id: string, level: number): string
	if id == "power" then
		return string.format("%d базового урона", 1 + level)
	elseif id == "crit" then
		return string.format("%d%%", math.round(Config.CritChance(level) * 100))
	elseif id == "critDamage" then
		return string.format("x%.2f", Config.CritMultiplier(level))
	elseif id == "greed" then
		return string.format("+%d%% эссенции", level * 10)
	elseif id == "luck" then
		return string.format("%.1f%% шанс", Config.LuckyChance(level) * 100)
	elseif id == "spirit" then
		return if level > 0 then string.format("%d%% урона/сек", level * 30) else "нет"
	elseif id == "speed" then
		return string.format("скорость %d", Config.WalkSpeed(level, false))
	end
	return ""
end

---------------------------------------------------------------------
-- Уровень игрока
---------------------------------------------------------------------
function Config.XpNeeded(level: number): number
	return math.floor(8 * level ^ 1.6)
end

function Config.LevelMultiplier(level: number): number
	return 1 + 0.03 * (level - 1) -- +3% эссенции за уровень
end

function Config.LevelDamageMultiplier(level: number): number
	return 1 + 0.01 * (level - 1) -- +1% урона за уровень
end

---------------------------------------------------------------------
-- Питомцы
---------------------------------------------------------------------
Config.Pets = {
	slots = 3, -- сколько можно надеть (+1 с Game Pass PetSlot)
	inventory = 40,
	goldEggPrice = 25, -- 💎
	eggOdds = { common = 0.62, rare = 0.27, epic = 0.09, legendary = 0.02 },
	goldEggOdds = { common = 0.30, rare = 0.40, epic = 0.22, legendary = 0.08 },
}

Config.RarityOrder = { "common", "rare", "epic", "legendary" }
Config.Rarities = {
	common = { name = "Обычный", color = Color3.fromRGB(185, 179, 204), essence = 0.10, damage = 0.00 },
	rare = { name = "Редкий", color = Color3.fromRGB(79, 163, 255), essence = 0.25, damage = 0.05 },
	epic = { name = "Эпический", color = Color3.fromRGB(192, 107, 255), essence = 0.60, damage = 0.20 },
	legendary = { name = "Легендарный", color = Color3.fromRGB(255, 176, 32), essence = 1.50, damage = 0.50 },
}

Config.PetPool = {
	common = {
		{ emoji = "🦇", name = "Ночная мышь" },
		{ emoji = "🕷️", name = "Паучок" },
		{ emoji = "🐀", name = "Подвальная крыса" },
	},
	rare = {
		{ emoji = "🐈‍⬛", name = "Теневой кот" },
		{ emoji = "🦉", name = "Сова-призрак" },
	},
	epic = {
		{ emoji = "👻", name = "Фантом" },
		{ emoji = "🐺", name = "Лунный волк" },
	},
	legendary = {
		{ emoji = "🐉", name = "Дракон Бездны" },
		{ emoji = "🔮", name = "Око тьмы" },
	},
}

-- pet = { uid = "...", rarity = "rare", kind = 1, tier = 2 }
function Config.PetInfo(pet)
	local pool = Config.PetPool[pet.rarity] or Config.PetPool.common
	return pool[pet.kind] or pool[1]
end

-- Возвращает бонус питомца: доля эссенции, доля урона.
function Config.PetStats(pet): (number, number)
	local rarity = Config.Rarities[pet.rarity] or Config.Rarities.common
	local tierFactor = 1 + (pet.tier - 1) * 0.75
	return rarity.essence * tierFactor, rarity.damage * tierFactor
end

function Config.PetPower(pet): number
	local essence, damage = Config.PetStats(pet)
	return essence + damage * 1.5
end

function Config.FindPet(data, uid: string)
	for _, pet in data.pets do
		if pet.uid == uid then
			return pet
		end
	end
	return nil
end

function Config.PetBonus(data): (number, number)
	local essence, damage = 0, 0
	for _, uid in data.equipped do
		local pet = Config.FindPet(data, uid)
		if pet then
			local e, d = Config.PetStats(pet)
			essence += e
			damage += d
		end
	end
	return essence, damage
end

function Config.PetSlots(passes): number
	return Config.Pets.slots + (if passes.PetSlot then 1 else 0)
end

---------------------------------------------------------------------
-- Боевые формулы (используют и сервер, и интерфейс)
---------------------------------------------------------------------
function Config.TapDamage(data): number
	local _, petDamage = Config.PetBonus(data)
	return (1 + data.upgrades.power) * (1 + petDamage) * Config.LevelDamageMultiplier(data.level)
end

function Config.SpiritDamage(data): number
	if data.upgrades.spirit <= 0 then
		return 0
	end
	return Config.TapDamage(data) * 0.3 * data.upgrades.spirit
end

function Config.EssenceMultiplier(data, passes, now: number): number
	local petEssence = Config.PetBonus(data)
	local multiplier = Config.GreedMultiplier(data.upgrades.greed)
		* Config.RebirthMultiplier(data.rebirths)
		* Config.LevelMultiplier(data.level)
		* (1 + petEssence)
	if passes.DoubleEssence then
		multiplier *= 2
	end
	if passes.VIP then
		multiplier *= 1.5
	end
	if (data.boostEndsAt or 0) > now then
		multiplier *= 2
	end
	return multiplier
end

---------------------------------------------------------------------
-- Перерождение
---------------------------------------------------------------------
Config.Rebirth = {
	baseCost = 25000,
	growth = 3,
	multiplierPerRebirth = 0.5, -- +50% эссенции за каждое перерождение
	gemsPerRebirth = 10, -- награда: 10 💎 × номер перерождения
}

function Config.RebirthCost(rebirths: number): number
	return math.floor(Config.Rebirth.baseCost * Config.Rebirth.growth ^ rebirths)
end

function Config.RebirthMultiplier(rebirths: number): number
	return 1 + Config.Rebirth.multiplierPerRebirth * rebirths
end

---------------------------------------------------------------------
-- Ежедневная награда
---------------------------------------------------------------------
Config.Daily = {
	cooldown = 20 * 3600, -- можно забирать раз в 20 часов
	streakWindow = 48 * 3600, -- если не зайти за 48 часов — серия сбрасывается
	maxStreak = 7,
	baseReward = 250,
}

function Config.NextDailyStreak(lastDaily: number, streak: number, now: number): number
	if lastDaily > 0 and now - lastDaily <= Config.Daily.streakWindow then
		return math.min(streak + 1, Config.Daily.maxStreak)
	end
	return 1
end

function Config.DailyReward(streak: number, unlockedZone: number, rebirths: number): number
	local zone = Config.Zones[unlockedZone]
	return math.floor(Config.Daily.baseReward * streak * zone.shadowValue * Config.RebirthMultiplier(rebirths))
end

---------------------------------------------------------------------
-- Задания (награда — кристаллы 💎)
---------------------------------------------------------------------
-- stat: kills, golden, bosses, eggs, crits — из data.stats; level и maxZone — из data.
Config.Quests = {
	{ id = "kills", icon = "👻", name = "Ловец теней", stat = "kills", text = "Поймать %s теней",
		goals = { 25, 100, 500, 2000, 10000, 50000 }, rewards = { 2, 5, 10, 20, 40, 80 } },
	{ id = "golden", icon = "✨", name = "Золотая лихорадка", stat = "golden", text = "Поймать %s золотых теней",
		goals = { 1, 10, 50, 200 }, rewards = { 3, 8, 20, 50 } },
	{ id = "bosses", icon = "⚔️", name = "Гроза Хранителей", stat = "bosses", text = "Победить %s Хранителей",
		goals = { 1, 5, 20, 50 }, rewards = { 5, 15, 40, 80 } },
	{ id = "eggs", icon = "🥚", name = "Заводчик", stat = "eggs", text = "Открыть %s яиц",
		goals = { 1, 10, 50, 200 }, rewards = { 2, 8, 20, 50 } },
	{ id = "crits", icon = "🎯", name = "Точный удар", stat = "crits", text = "Нанести %s критов",
		goals = { 50, 500, 5000, 25000 }, rewards = { 2, 8, 20, 40 } },
	{ id = "level", icon = "⭐", name = "Опыт тьмы", stat = "level", text = "Достичь %s уровня",
		goals = { 5, 10, 20, 35, 50 }, rewards = { 3, 8, 15, 30, 60 } },
	{ id = "zones", icon = "🗺️", name = "Исследователь", stat = "maxZone", text = "Открыть зону %s",
		goals = { 2, 3, 4, 5 }, rewards = { 5, 10, 25, 50 } },
}

function Config.QuestStat(data, stat: string): number
	if stat == "level" then
		return data.level
	elseif stat == "maxZone" then
		return data.maxZone
	end
	return data.stats[stat] or 0
end

function Config.FindQuest(id: string)
	for _, quest in Config.Quests do
		if quest.id == id then
			return quest
		end
	end
	return nil
end

-- Можно ли забрать награду за текущий этап задания.
function Config.QuestReady(data, quest): boolean
	local stage = (data.quests[quest.id] or 0) + 1
	local goal = quest.goals[stage]
	return goal ~= nil and Config.QuestStat(data, quest.stat) >= goal
end

---------------------------------------------------------------------
-- Доход, пока игрока не было
---------------------------------------------------------------------
Config.Offline = {
	minSeconds = 120,
	maxSeconds = 8 * 3600,
	efficiency = 0.5, -- офлайн духи собирают в 2 раза медленнее
}

---------------------------------------------------------------------
-- Буст за кристаллы
---------------------------------------------------------------------
Config.GemBoost = {
	price = 10,
	duration = 5 * 60,
}

---------------------------------------------------------------------
-- Монетизация
---------------------------------------------------------------------
-- 1. Создайте Game Passes и Developer Products в Creator Dashboard
--    (create.roblox.com → ваша игра → Monetization).
-- 2. Впишите их ID вместо 0. Пока ID = 0, кнопка в магазине неактивна.
-- price — только запасной текст для кнопки; настоящая цена берётся из Roblox.

Config.GamePasses = {
	DoubleEssence = {
		id = 0,
		icon = "✖️",
		name = "x2 Эссенция",
		description = "Навсегда удваивает всю эссенцию",
		price = 199,
	},
	AutoCatch = {
		id = 0,
		icon = "🤖",
		name = "Авто-ловля",
		description = "Фонарь сам бьёт ближайшую тень",
		price = 249,
	},
	PetSlot = {
		id = 0,
		icon = "🐾",
		name = "+1 слот питомца",
		description = "4 питомца вместо 3",
		price = 149,
	},
	VIP = {
		id = 0,
		icon = "👑",
		name = "Теневой VIP",
		description = "+50% эссенции и +4 к скорости",
		price = 299,
	},
}
Config.GamePassOrder = { "DoubleEssence", "AutoCatch", "PetSlot", "VIP" }

-- kind = "essence": amount × награда тени лучшей открытой зоны × множитель перерождений
-- kind = "boost": x2 эссенция на duration секунд (время складывается)
-- kind = "gems": amount кристаллов
Config.Products = {
	Boost = {
		id = 0,
		icon = "⚡",
		kind = "boost",
		name = "Буст x2 на 15 минут",
		duration = 15 * 60,
		price = 49,
	},
	Gems = {
		id = 0,
		icon = "💎",
		kind = "gems",
		name = "Мешочек кристаллов",
		amount = 50,
		price = 99,
	},
	EssenceMedium = {
		id = 0,
		icon = "🧪",
		kind = "essence",
		name = "Сосуд эссенции",
		amount = 5000,
		price = 99,
	},
	EssenceLarge = {
		id = 0,
		icon = "📦",
		kind = "essence",
		name = "Сундук эссенции",
		amount = 50000,
		price = 399,
	},
}
Config.ProductOrder = { "Boost", "Gems", "EssenceMedium", "EssenceLarge" }

function Config.EssencePackAmount(product, unlockedZone: number, rebirths: number): number
	local zone = Config.Zones[unlockedZone]
	return math.floor(product.amount * zone.shadowValue * Config.RebirthMultiplier(rebirths))
end

return Config
