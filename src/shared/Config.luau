-- Все настройки баланса и монетизации в одном месте.
-- Меняйте цифры здесь — сервер и интерфейс подхватят их автоматически.

local Config = {}

---------------------------------------------------------------------
-- Данные
---------------------------------------------------------------------
-- Если поменять имя — у всех игроков начнётся новый прогресс.
Config.DataStoreName = "ShadowWorld_PlayerData_v1"
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

-- Зоны идут по порядку. price — цена открытия в эссенции.
-- shadowHp — сколько урона нужно, чтобы поймать тень.
-- shadowValue — базовая награда за тень.
Config.Zones = {
	{
		name = "Сумеречный лес",
		price = 0,
		shadowHp = 3,
		shadowValue = 1,
		floorColor = Color3.fromRGB(46, 58, 52),
		shadowColor = Color3.fromRGB(15, 12, 25),
		glowColor = Color3.fromRGB(140, 90, 255),
	},
	{
		name = "Туманные болота",
		price = 500,
		shadowHp = 12,
		shadowValue = 6,
		floorColor = Color3.fromRGB(52, 62, 70),
		shadowColor = Color3.fromRGB(25, 20, 45),
		glowColor = Color3.fromRGB(90, 200, 170),
	},
	{
		name = "Пепельные руины",
		price = 5000,
		shadowHp = 40,
		shadowValue = 25,
		floorColor = Color3.fromRGB(70, 52, 45),
		shadowColor = Color3.fromRGB(45, 15, 15),
		glowColor = Color3.fromRGB(255, 110, 60),
	},
	{
		name = "Ледяной склеп",
		price = 50000,
		shadowHp = 150,
		shadowValue = 120,
		floorColor = Color3.fromRGB(70, 90, 110),
		shadowColor = Color3.fromRGB(20, 30, 60),
		glowColor = Color3.fromRGB(120, 200, 255),
	},
	{
		name = "Бездна",
		price = 500000,
		shadowHp = 600,
		shadowValue = 600,
		floorColor = Color3.fromRGB(25, 15, 35),
		shadowColor = Color3.fromRGB(60, 0, 90),
		glowColor = Color3.fromRGB(255, 60, 200),
	},
}

---------------------------------------------------------------------
-- Тени
---------------------------------------------------------------------
Config.ShadowsPerZone = 8
Config.ShadowRespawnTime = 3 -- секунд
Config.ClickCooldown = 0.12 -- защита от автокликеров (секунд между ударами)
Config.ClickRange = 32 -- с какого расстояния можно кликнуть по тени
Config.AutoCatchInterval = 0.5 -- как часто бьёт авто-ловля
Config.AutoCatchRange = 30

---------------------------------------------------------------------
-- Улучшения
---------------------------------------------------------------------
Config.Upgrades = {
	power = {
		name = "Сила фонаря",
		description = "+1 урон по тени за клик",
		baseCost = 10,
		growth = 1.45,
		maxLevel = 200,
	},
	greed = {
		name = "Жадность",
		description = "+10% эссенции за тень",
		baseCost = 25,
		growth = 1.55,
		maxLevel = 200,
	},
	speed = {
		name = "Теневой шаг",
		description = "+2 к скорости бега",
		baseCost = 50,
		growth = 2.2,
		maxLevel = 10,
	},
}
Config.UpgradeOrder = { "power", "greed", "speed" }

function Config.UpgradeCost(id: string, level: number): number
	local def = Config.Upgrades[id]
	return math.floor(def.baseCost * def.growth ^ level)
end

function Config.Damage(powerLevel: number): number
	return 1 + powerLevel
end

function Config.GreedMultiplier(greedLevel: number): number
	return 1 + 0.1 * greedLevel
end

function Config.WalkSpeed(speedLevel: number, isVip: boolean): number
	return 16 + 2 * speedLevel + (if isVip then 4 else 0)
end

---------------------------------------------------------------------
-- Перерождение
---------------------------------------------------------------------
Config.Rebirth = {
	baseCost = 25000,
	growth = 3,
	multiplierPerRebirth = 0.5, -- +50% эссенции за каждое перерождение
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
-- Монетизация
---------------------------------------------------------------------
-- 1. Создайте Game Passes и Developer Products в Creator Dashboard
--    (create.roblox.com → ваша игра → Monetization).
-- 2. Впишите их ID вместо 0. Пока ID = 0, кнопка в магазине неактивна.
-- price — только запасной текст для кнопки; настоящая цена берётся из Roblox.

Config.GamePasses = {
	DoubleEssence = {
		id = 0,
		name = "x2 Эссенция",
		description = "Навсегда удваивает всю эссенцию",
		price = 199,
	},
	AutoCatch = {
		id = 0,
		name = "Авто-ловля",
		description = "Фонарь сам бьёт ближайшую тень",
		price = 249,
	},
	VIP = {
		id = 0,
		name = "Теневой VIP",
		description = "+50% эссенции и +4 к скорости",
		price = 299,
	},
}
Config.GamePassOrder = { "DoubleEssence", "AutoCatch", "VIP" }

-- kind = "essence": amount × награда тени лучшей открытой зоны × множитель перерождений
-- kind = "boost": x2 эссенция на duration секунд (время складывается)
Config.Products = {
	EssenceSmall = {
		id = 0,
		kind = "essence",
		name = "Горсть эссенции",
		amount = 500,
		price = 25,
	},
	EssenceMedium = {
		id = 0,
		kind = "essence",
		name = "Сосуд эссенции",
		amount = 5000,
		price = 99,
	},
	EssenceLarge = {
		id = 0,
		kind = "essence",
		name = "Сундук эссенции",
		amount = 50000,
		price = 399,
	},
	Boost = {
		id = 0,
		kind = "boost",
		name = "Буст x2 на 15 минут",
		duration = 15 * 60,
		price = 49,
	},
}
Config.ProductOrder = { "Boost", "EssenceSmall", "EssenceMedium", "EssenceLarge" }

function Config.EssencePackAmount(product, unlockedZone: number, rebirths: number): number
	local zone = Config.Zones[unlockedZone]
	return math.floor(product.amount * zone.shadowValue * Config.RebirthMultiplier(rebirths))
end

---------------------------------------------------------------------
-- Итоговый множитель эссенции (используют и сервер, и интерфейс)
---------------------------------------------------------------------
function Config.EssenceMultiplier(data, passes, now: number): number
	local multiplier = Config.GreedMultiplier(data.upgrades.greed) * Config.RebirthMultiplier(data.rebirths)
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

return Config
