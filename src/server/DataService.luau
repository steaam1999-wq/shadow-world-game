-- Загрузка, хранение и сохранение данных игроков (DataStore).
-- Сервер — единственный источник правды: клиент только получает снимки.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Format = require(ReplicatedStorage.Shared.Format)
local Remotes = require(script.Parent.Remotes)

local DataService = {}

local TEMPLATE = {
	essence = 0,
	totalEssence = 0,
	gems = 0,
	rebirths = 0,
	level = 1,
	xp = 0,
	upgrades = {
		power = 0,
		crit = 0,
		critDamage = 0,
		greed = 0,
		luck = 0,
		spirit = 0,
		speed = 0,
	},
	unlockedZone = 1,
	maxZone = 1, -- самая дальняя зона за всё время (для заданий)
	pets = {}, -- { { uid, rarity, kind, tier } }
	equipped = {}, -- uid надетых питомцев
	quests = {}, -- [questId] = сколько этапов пройдено
	stats = {
		kills = 0,
		golden = 0,
		bosses = 0,
		eggs = 0,
		crits = 0,
		taps = 0,
		time = 0,
	},
	lastDaily = 0,
	dailyStreak = 0,
	boostEndsAt = 0,
	lastSeen = 0,
	purchases = {}, -- [PurchaseId] = true — защита от двойной выдачи покупок
	purchaseLog = {}, -- порядок покупок, чтобы хранить только последние
}

local MAX_PURCHASE_HISTORY = 50

local store: DataStore? = nil
local sessions = {} -- [Player] = session
local loadedCallbacks = {}

local function deepCopy(value)
	if type(value) ~= "table" then
		return value
	end
	local copy = {}
	for key, inner in value do
		copy[key] = deepCopy(inner)
	end
	return copy
end

-- Добавляет недостающие поля (когда в игре появляются новые данные).
local function reconcile(data, template)
	for key, value in template do
		if data[key] == nil then
			data[key] = deepCopy(value)
		elseif type(value) == "table" and type(data[key]) == "table" then
			reconcile(data[key], value)
		end
	end
end

local function keyFor(player: Player): string
	return "player_" .. player.UserId
end

local function retry(callback, attempts: number)
	local lastError
	for attempt = 1, attempts do
		local ok, result = pcall(callback)
		if ok then
			return true, result
		end
		lastError = result
		warn(string.format("[DataService] попытка %d/%d не удалась: %s", attempt, attempts, tostring(result)))
		if attempt < attempts then
			task.wait(2 ^ attempt)
		end
	end
	return false, lastError
end

local function createLeaderstats(player: Player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"

	local essence = Instance.new("StringValue")
	essence.Name = "Эссенция"
	essence.Value = "0"
	essence.Parent = leaderstats

	local level = Instance.new("IntValue")
	level.Name = "Уровень"
	level.Value = 1
	level.Parent = leaderstats

	local rebirths = Instance.new("IntValue")
	rebirths.Name = "Перерождения"
	rebirths.Parent = leaderstats

	leaderstats.Parent = player
end

local function updateLeaderstats(player: Player, data)
	local leaderstats = player:FindFirstChild("leaderstats")
	if not leaderstats then
		return
	end
	local essence = leaderstats:FindFirstChild("Эссенция")
	local rebirths = leaderstats:FindFirstChild("Перерождения")
	if essence then
		essence.Value = Format.Number(data.essence)
	end
	if rebirths then
		rebirths.Value = data.rebirths
	end
	local level = leaderstats:FindFirstChild("Уровень")
	if level then
		level.Value = data.level
	end
end

local function loadPlayer(player: Player)
	local data
	local canSave = false

	if store then
		local ok, result = retry(function()
			return store:GetAsync(keyFor(player))
		end, 3)

		if ok then
			data = if type(result) == "table" then result else deepCopy(TEMPLATE)
			canSave = true
		elseif RunService:IsStudio() then
			warn("[DataService] DataStore недоступен в Studio — прогресс не будет сохраняться. "
				.. "Включите Game Settings → Security → Enable Studio Access to API Services.")
			data = deepCopy(TEMPLATE)
		else
			-- Не пускаем в игру без данных, иначе можно затереть настоящий прогресс.
			player:Kick("Не удалось загрузить ваши данные. Пожалуйста, перезайдите.")
			return
		end
	else
		data = deepCopy(TEMPLATE)
	end

	reconcile(data, TEMPLATE)
	data.unlockedZone = math.clamp(data.unlockedZone, 1, #Config.Zones)
	data.maxZone = math.max(data.maxZone, data.unlockedZone)

	if player.Parent ~= Players then
		return -- игрок вышел, пока грузились данные
	end

	sessions[player] = {
		data = data,
		canSave = canSave,
		passes = {}, -- заполняет MonetizationService
		dirty = false,
		lastClick = 0,
		lastAction = 0,
		lastNotice = 0,
		combo = 0,
		lastComboHit = 0,
	}

	createLeaderstats(player)
	DataService.Push(player)

	for _, callback in loadedCallbacks do
		task.spawn(callback, player)
	end
end

-- Возвращает сессию игрока или nil, если данные ещё не загружены.
function DataService.Get(player: Player)
	return sessions[player]
end

-- Вызывает callback(player), когда данные игрока загружены.
function DataService.OnPlayerLoaded(callback)
	table.insert(loadedCallbacks, callback)
end

-- Отправляет клиенту свежий снимок данных прямо сейчас.
function DataService.Push(player: Player)
	local session = sessions[player]
	if not session then
		return
	end
	session.dirty = false
	local data = session.data
	local snapshot = { passes = session.passes }
	for key, value in data do
		if key ~= "purchases" and key ~= "purchaseLog" then
			snapshot[key] = value
		end
	end
	Remotes.DataChanged:FireClient(player, snapshot)
	updateLeaderstats(player, data)
end

-- Помечает данные изменёнными: снимок уйдёт клиенту в ближайшие доли секунды.
-- Нужно для частых событий (клики), чтобы не спамить сетью.
function DataService.MarkDirty(player: Player)
	local session = sessions[player]
	if session then
		session.dirty = true
	end
end

-- Отмечает покупку выданной и хранит только последние N идентификаторов.
function DataService.RecordPurchase(player: Player, purchaseId: string)
	local session = sessions[player]
	if not session then
		return
	end
	local data = session.data
	data.purchases[purchaseId] = true
	table.insert(data.purchaseLog, purchaseId)
	while #data.purchaseLog > MAX_PURCHASE_HISTORY do
		local oldest = table.remove(data.purchaseLog, 1)
		data.purchases[oldest] = nil
	end
end

function DataService.Save(player: Player): boolean
	local session = sessions[player]
	if not session or not session.canSave or not store then
		return false
	end
	session.data.lastSeen = os.time()
	local snapshot = deepCopy(session.data)
	local ok = retry(function()
		store:SetAsync(keyFor(player), snapshot, { player.UserId })
	end, 3)
	return ok
end

function DataService.Start()
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(Config.DataStoreName)
	end)
	if ok then
		store = result
	else
		warn("[DataService] DataStore недоступен: " .. tostring(result))
	end

	Players.PlayerAdded:Connect(loadPlayer)
	for _, player in Players:GetPlayers() do
		task.spawn(loadPlayer, player)
	end

	Players.PlayerRemoving:Connect(function(player)
		if sessions[player] then
			DataService.Save(player)
			sessions[player] = nil
		end
	end)

	-- Автосохранение
	task.spawn(function()
		while true do
			task.wait(Config.AutosaveInterval)
			for player in sessions do
				task.spawn(DataService.Save, player)
			end
		end
	end)

	-- Отправка «грязных» снимков клиентам
	task.spawn(function()
		while true do
			task.wait(0.25)
			for player, session in sessions do
				if session.dirty then
					DataService.Push(player)
				end
			end
		end
	end)

	-- Сохранение всех при выключении сервера
	game:BindToClose(function()
		local pending = 0
		for player in sessions do
			pending += 1
			task.spawn(function()
				DataService.Save(player)
				pending -= 1
			end)
		end
		local started = os.clock()
		while pending > 0 and os.clock() - started < 25 do
			task.wait(0.1)
		end
	end)
end

return DataService
