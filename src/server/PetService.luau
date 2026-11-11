-- Питомцы: яйца, надевание/снятие, удаление и модели, которые летают за игроком.

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local DataService = require(script.Parent.DataService)
local GameService = require(script.Parent.GameService)

local PetService = {}

local petModels = {} -- [Player] = { BasePart }

---------------------------------------------------------------------
-- Модели питомцев в мире
---------------------------------------------------------------------

local function clearModels(player: Player)
	for _, part in petModels[player] or {} do
		part:Destroy()
	end
	petModels[player] = {}
end

-- Позиция питомца относительно игрока: полукругом за спиной.
local function slotOffset(index: number, count: number): Vector3
	local spread = (index - (count + 1) / 2) * 3.2
	return Vector3.new(spread, 1.5 + (index % 2) * 0.8, 4.5)
end

local function createPetPart(pet, root: BasePart, index: number, count: number): BasePart
	local info = Config.PetInfo(pet)
	local rarity = Config.Rarities[pet.rarity]

	local part = Instance.new("Part")
	part.Name = "Pet_" .. info.name
	part.Shape = Enum.PartType.Ball
	part.Size = Vector3.new(1.4, 1.4, 1.4)
	part.Material = Enum.Material.Neon
	part.Color = rarity.color
	part.Transparency = 0.35
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Massless = true
	part.CFrame = root.CFrame * CFrame.new(slotOffset(index, count))

	local light = Instance.new("PointLight")
	light.Color = rarity.color
	light.Range = 8
	light.Brightness = 1.5
	light.Parent = part

	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.fromScale(3, 3)
	billboard.LightInfluence = 0
	billboard.MaxDistance = 120
	billboard.Parent = part

	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.TextScaled = true
	label.Text = info.emoji
	label.Parent = billboard

	-- Физическое следование за игроком (плавно и без нагрузки на сервер)
	local petAttachment = Instance.new("Attachment")
	petAttachment.Parent = part

	local slotAttachment = Instance.new("Attachment")
	slotAttachment.Name = "PetSlot" .. index
	slotAttachment.Position = slotOffset(index, count)
	slotAttachment.Parent = root

	local align = Instance.new("AlignPosition")
	align.Attachment0 = petAttachment
	align.Attachment1 = slotAttachment
	align.Responsiveness = 18
	align.MaxForce = 1e6
	align.Parent = part

	local orient = Instance.new("AlignOrientation")
	orient.Attachment0 = petAttachment
	orient.Attachment1 = slotAttachment
	orient.Responsiveness = 18
	orient.MaxTorque = 1e6
	orient.Parent = part

	-- При удалении питомца убираем и точку крепления на персонаже
	part.Destroying:Connect(function()
		slotAttachment:Destroy()
	end)

	return part
end

function PetService.Refresh(player: Player)
	clearModels(player)
	local session = DataService.Get(player)
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if not session or not root then
		return
	end

	local pets = {}
	for _, uid in session.data.equipped do
		local pet = Config.FindPet(session.data, uid)
		if pet then
			table.insert(pets, pet)
		end
	end

	for index, pet in pets do
		local part = createPetPart(pet, root, index, #pets)
		part.Parent = character
		pcall(function()
			part:SetNetworkOwner(player)
		end)
		table.insert(petModels[player], part)
	end
end

-- Части питомцев игрока (для выстрелов духа-помощника).
function PetService.GetPetParts(player: Player): { BasePart }
	return petModels[player] or {}
end

---------------------------------------------------------------------
-- Яйца
---------------------------------------------------------------------

local function rollRarity(odds): string
	local roll = math.random()
	for _, rarity in Config.RarityOrder do
		if roll < odds[rarity] then
			return rarity
		end
		roll -= odds[rarity]
	end
	return "common"
end

-- tier: номер зоны яйца (1..5) или "gold" — Золотое яйцо за кристаллы.
GameService.RegisterAction("openEgg", function(player, session, tier)
	local data = session.data
	if #data.pets >= Config.Pets.inventory then
		return GameService.Notify(player, "Инвентарь полон — удалите слабых питомцев", "bad")
	end

	local odds = Config.Pets.eggOdds
	if tier == "gold" then
		if data.gems < Config.Pets.goldEggPrice then
			return GameService.Notify(player, "Не хватает кристаллов 💎", "bad")
		end
		data.gems -= Config.Pets.goldEggPrice
		odds = Config.Pets.goldEggOdds
		tier = data.unlockedZone
	else
		if type(tier) ~= "number" or tier % 1 ~= 0 or tier < 1 or tier > data.unlockedZone then
			return
		end
		local price = Config.Zones[tier].eggPrice
		if data.essence < price then
			return GameService.Notify(player, "Не хватает эссенции", "bad")
		end
		data.essence -= price
	end

	local rarity = rollRarity(odds)
	local pet = {
		uid = HttpService:GenerateGUID(false),
		rarity = rarity,
		kind = math.random(1, #Config.PetPool[rarity]),
		tier = tier,
	}
	table.insert(data.pets, pet)
	data.stats.eggs += 1

	local autoEquipped = false
	if #data.equipped < Config.PetSlots(session.passes) then
		table.insert(data.equipped, pet.uid)
		autoEquipped = true
		PetService.Refresh(player)
	end

	DataService.Push(player)
	GameService.Fx(player, "hatch", pet, autoEquipped)
end)

---------------------------------------------------------------------
-- Управление питомцами
---------------------------------------------------------------------

GameService.RegisterAction("toggleEquip", function(player, session, uid)
	local data = session.data
	if type(uid) ~= "string" or not Config.FindPet(data, uid) then
		return
	end
	local index = table.find(data.equipped, uid)
	if index then
		table.remove(data.equipped, index)
	elseif #data.equipped < Config.PetSlots(session.passes) then
		table.insert(data.equipped, uid)
	else
		return GameService.Notify(player, "Все слоты заняты — снимите одного питомца", "bad")
	end
	PetService.Refresh(player)
	DataService.Push(player)
end)

GameService.RegisterAction("equipBest", function(player, session)
	local data = session.data
	local sorted = table.clone(data.pets)
	table.sort(sorted, function(a, b)
		return Config.PetPower(a) > Config.PetPower(b)
	end)
	data.equipped = {}
	for i = 1, math.min(#sorted, Config.PetSlots(session.passes)) do
		table.insert(data.equipped, sorted[i].uid)
	end
	PetService.Refresh(player)
	DataService.Push(player)
	GameService.Notify(player, "Надеты лучшие питомцы", "good")
end)

GameService.RegisterAction("deletePet", function(player, session, uid)
	local data = session.data
	if type(uid) ~= "string" then
		return
	end
	if table.find(data.equipped, uid) then
		return GameService.Notify(player, "Сначала снимите питомца", "bad")
	end
	for i, pet in data.pets do
		if pet.uid == uid then
			table.remove(data.pets, i)
			break
		end
	end
	DataService.Push(player)
end)

---------------------------------------------------------------------

function PetService.Init()
	DataService.OnPlayerLoaded(function(player)
		petModels[player] = {}
		player.CharacterAdded:Connect(function(character)
			character:WaitForChild("HumanoidRootPart", 10)
			PetService.Refresh(player)
		end)
		PetService.Refresh(player)
	end)

	Players.PlayerRemoving:Connect(function(player)
		clearModels(player)
		petModels[player] = nil
	end)
end

return PetService
