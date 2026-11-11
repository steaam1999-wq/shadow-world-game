-- Генерирует мир (зоны, мосты, освещение) и управляет тенями.
-- Карту потом можно заменить своей — логика теней от неё почти не зависит.

local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local DataService = require(script.Parent.DataService)
local GameService = require(script.Parent.GameService)

local WorldService = {}

local ZONE_SIZE = Config.World.ZoneSize
local ZONE_GAP = Config.World.ZoneGap

local rng = Random.new()
local worldFolder: Folder
local shadowsFolder: Folder
local shadowStates = {} -- [BasePart] = state

local function zoneCenter(index: number): Vector3
	return Vector3.new((index - 1) * (ZONE_SIZE + ZONE_GAP), 0, 0)
end

-- Точка входа в зону (западный край) — сюда телепортируем игрока.
local function zoneEntrance(index: number): Vector3
	return zoneCenter(index) + Vector3.new(-ZONE_SIZE / 2 + 12, 4, 0)
end

local function clampToZone(index: number, position: Vector3): Vector3
	local center = zoneCenter(index)
	local half = ZONE_SIZE / 2 - 8
	return Vector3.new(
		math.clamp(position.X, center.X - half, center.X + half),
		position.Y,
		math.clamp(position.Z, center.Z - half, center.Z + half)
	)
end

local function randomPointInZone(index: number, height: number): Vector3
	local center = zoneCenter(index)
	local half = ZONE_SIZE / 2 - 10
	return center + Vector3.new(rng:NextNumber(-half, half), height, rng:NextNumber(-half, half))
end

-- Свойства, которые нужно ставить в строгом порядке (форма → размер → остальное → позиция).
local ORDERED_FIRST = { "Shape", "Size" }
local ORDERED_LAST = { "Position", "CFrame", "Parent" }
local SPECIAL = { Shape = true, Size = true, Position = true, CFrame = true, Parent = true }

local function makePart(props): Part
	local part = Instance.new("Part")
	part.Anchored = true
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	for _, key in ORDERED_FIRST do
		if props[key] ~= nil then
			part[key] = props[key]
		end
	end
	for key, value in props do
		if not SPECIAL[key] then
			part[key] = value
		end
	end
	for _, key in ORDERED_LAST do
		if props[key] ~= nil then
			part[key] = props[key]
		end
	end
	return part
end

---------------------------------------------------------------------
-- Карта
---------------------------------------------------------------------

local function applyLighting()
	Lighting.ClockTime = 0
	Lighting.Brightness = 1.5
	Lighting.Ambient = Color3.fromRGB(70, 60, 100)
	Lighting.OutdoorAmbient = Color3.fromRGB(90, 80, 130)

	if not Lighting:FindFirstChildOfClass("Atmosphere") then
		local atmosphere = Instance.new("Atmosphere")
		atmosphere.Density = 0.35
		atmosphere.Color = Color3.fromRGB(80, 70, 120)
		atmosphere.Decay = Color3.fromRGB(40, 30, 70)
		atmosphere.Parent = Lighting
	end
end

local function buildZone(index: number, zone)
	local model = Instance.new("Model")
	model.Name = string.format("Zone%d", index)

	local center = zoneCenter(index)

	makePart({
		Name = "Floor",
		Size = Vector3.new(ZONE_SIZE, 4, ZONE_SIZE),
		Position = center - Vector3.new(0, 2, 0),
		Color = zone.floorColor,
		Material = Enum.Material.Slate,
		Parent = model,
	})

	-- Мост к следующей зоне
	if index < #Config.Zones then
		makePart({
			Name = "Bridge",
			Size = Vector3.new(ZONE_GAP, 2, 16),
			Position = center + Vector3.new(ZONE_SIZE / 2 + ZONE_GAP / 2, -1, 0),
			Color = Color3.fromRGB(40, 35, 55),
			Material = Enum.Material.WoodPlanks,
			Parent = model,
		})
	end

	-- Декор: тёмные колонны со свечением
	for _ = 1, 6 do
		local height = rng:NextNumber(10, 24)
		local pillar = makePart({
			Name = "Pillar",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(height, 3, 3),
			CFrame = CFrame.new(randomPointInZone(index, height / 2)) * CFrame.Angles(0, 0, math.rad(90)),
			Color = zone.shadowColor,
			Material = Enum.Material.Basalt,
			Parent = model,
		})
		local light = Instance.new("PointLight")
		light.Color = zone.glowColor
		light.Range = 16
		light.Brightness = 1.5
		light.Parent = pillar
	end

	-- Табличка с названием и ценой зоны
	local signAnchor = makePart({
		Name = "Sign",
		Size = Vector3.new(1, 1, 1),
		Position = zoneEntrance(index) + Vector3.new(0, 10, 0),
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
		Parent = model,
	})
	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.fromOffset(320, 80)
	billboard.MaxDistance = 220
	billboard.Parent = signAnchor

	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = true
	label.TextColor3 = zone.glowColor
	label.TextStrokeTransparency = 0.3
	label.Text = if zone.price > 0
		then string.format("%s\n🔒 %d эссенции", zone.name, zone.price)
		else zone.name
	label.Parent = billboard

	model.Parent = worldFolder
end

local function buildWorld()
	if Config.World.RemoveDefaultBaseplate then
		local baseplate = workspace:FindFirstChild("Baseplate")
		if baseplate then
			baseplate:Destroy()
		end
		for _, child in workspace:GetChildren() do
			if child:IsA("SpawnLocation") then
				child:Destroy()
			end
		end
	end

	if Config.World.ApplyLighting then
		applyLighting()
	end

	worldFolder = Instance.new("Folder")
	worldFolder.Name = "ShadowWorld"
	worldFolder.Parent = workspace

	for index, zone in Config.Zones do
		buildZone(index, zone)
	end

	local spawn = Instance.new("SpawnLocation")
	spawn.Anchored = true
	spawn.Size = Vector3.new(10, 1, 10)
	spawn.Position = zoneEntrance(1) - Vector3.new(0, 3.5, 0)
	spawn.Color = Color3.fromRGB(140, 90, 255)
	spawn.Material = Enum.Material.Neon
	spawn.Duration = 0
	spawn.Parent = worldFolder

	shadowsFolder = Instance.new("Folder")
	shadowsFolder.Name = "Shadows"
	shadowsFolder.Parent = workspace
end

---------------------------------------------------------------------
-- Тени
---------------------------------------------------------------------

local spawnShadow -- объявлено заранее, чтобы использовать внутри Hit

local function updateHealthBar(state)
	local ratio = math.clamp(state.hp / state.maxHp, 0, 1)
	state.fill.Size = UDim2.fromScale(ratio, 1)
end

local function wander(part: BasePart, state)
	while state.alive do
		local target = clampToZone(
			state.zone,
			part.Position + Vector3.new(rng:NextNumber(-18, 18), 0, rng:NextNumber(-18, 18))
		)
		local duration = rng:NextNumber(2.5, 4.5)
		TweenService:Create(part, TweenInfo.new(duration, Enum.EasingStyle.Sine), { Position = target }):Play()
		task.wait(duration + rng:NextNumber(0.5, 2))
	end
end

local function killShadow(part: BasePart, state)
	state.alive = false
	shadowStates[part] = nil

	local tween = TweenService:Create(part, TweenInfo.new(0.25), {
		Size = part.Size * 1.8,
		Transparency = 1,
	})
	tween:Play()
	tween.Completed:Once(function()
		part:Destroy()
	end)

	task.delay(Config.ShadowRespawnTime, spawnShadow, state.zone)
end

-- Удар по тени. isAuto = удар от авто-ловли (без кулдауна клика).
function WorldService.Hit(player: Player, part: BasePart, isAuto: boolean)
	local state = shadowStates[part]
	if not state or not state.alive then
		return
	end
	local session = DataService.Get(player)
	if not session then
		return
	end

	local now = os.clock()
	if not isAuto then
		if now - session.lastClick < Config.ClickCooldown then
			return
		end
		session.lastClick = now

		-- Проверка расстояния на сервере (защита от читов)
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		if not root or (root.Position - part.Position).Magnitude > Config.ClickRange + 10 then
			return
		end
	end

	if session.data.unlockedZone < state.zone then
		if now - session.lastNotice > 2 then
			session.lastNotice = now
			GameService.Notify(player, "Эта зона закрыта — откройте её в меню «Зоны»", "bad")
		end
		return
	end

	state.hp -= Config.Damage(session.data.upgrades.power)
	if state.hp <= 0 then
		killShadow(part, state)
		GameService.RewardShadow(player, state.zone)
	else
		updateHealthBar(state)
	end
end

function spawnShadow(zoneIndex: number)
	local zone = Config.Zones[zoneIndex]
	local size = 4 * (1 + (zoneIndex - 1) * 0.2)

	local part = makePart({
		Name = "Shadow",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(size, size, size),
		Position = randomPointInZone(zoneIndex, size / 2 + 1),
		Color = zone.shadowColor,
		Material = Enum.Material.SmoothPlastic,
		CanCollide = false,
	})

	local light = Instance.new("PointLight")
	light.Color = zone.glowColor
	light.Range = 10
	light.Brightness = 2
	light.Parent = part

	local click = Instance.new("ClickDetector")
	click.MaxActivationDistance = Config.ClickRange
	click.Parent = part

	-- Полоска здоровья
	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.fromOffset(80, 10)
	billboard.StudsOffset = Vector3.new(0, size / 2 + 1.5, 0)
	billboard.MaxDistance = 70
	billboard.Parent = part

	local back = Instance.new("Frame")
	back.Size = UDim2.fromScale(1, 1)
	back.BackgroundColor3 = Color3.fromRGB(20, 15, 30)
	back.BorderSizePixel = 0
	back.Parent = billboard

	local fill = Instance.new("Frame")
	fill.Size = UDim2.fromScale(1, 1)
	fill.BackgroundColor3 = zone.glowColor
	fill.BorderSizePixel = 0
	fill.Parent = back

	local state = {
		zone = zoneIndex,
		hp = zone.shadowHp,
		maxHp = zone.shadowHp,
		alive = true,
		fill = fill,
	}
	shadowStates[part] = state

	click.MouseClick:Connect(function(player)
		WorldService.Hit(player, part, false)
	end)

	part.Parent = shadowsFolder
	task.spawn(wander, part, state)
end

-- Авто-ловля для владельцев Game Pass
local function autoCatchLoop()
	while true do
		task.wait(Config.AutoCatchInterval)
		for _, player in Players:GetPlayers() do
			local session = DataService.Get(player)
			local character = player.Character
			local root = character and character:FindFirstChild("HumanoidRootPart")
			if session and session.passes.AutoCatch and root then
				local nearest, nearestDistance = nil, Config.AutoCatchRange
				for part, state in shadowStates do
					if state.alive and state.zone <= session.data.unlockedZone then
						local distance = (part.Position - root.Position).Magnitude
						if distance < nearestDistance then
							nearest, nearestDistance = part, distance
						end
					end
				end
				if nearest then
					WorldService.Hit(player, nearest, true)
				end
			end
		end
	end
end

---------------------------------------------------------------------

function WorldService.Init()
	buildWorld()

	for zoneIndex = 1, #Config.Zones do
		for _ = 1, Config.ShadowsPerZone do
			spawnShadow(zoneIndex)
		end
	end

	task.spawn(autoCatchLoop)

	GameService.RegisterAction("teleport", function(player, session, zoneIndex)
		if type(zoneIndex) ~= "number" or zoneIndex % 1 ~= 0 then
			return
		end
		if zoneIndex < 1 or zoneIndex > session.data.unlockedZone then
			return
		end
		local character = player.Character
		if character then
			character:PivotTo(CFrame.new(zoneEntrance(zoneIndex)) * CFrame.Angles(0, math.rad(-90), 0))
		end
	end)
end

return WorldService
