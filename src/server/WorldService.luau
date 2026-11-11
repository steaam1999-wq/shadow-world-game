-- Генерирует мир (зоны, мосты, освещение, частицы) и управляет тенями:
-- обычными, золотыми и Хранителями зон.

local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local DataService = require(script.Parent.DataService)
local GameService = require(script.Parent.GameService)
local PetService = require(script.Parent.PetService)

local WorldService = {}

local ZONE_SIZE = Config.World.ZoneSize
local ZONE_GAP = Config.World.ZoneGap

local rng = Random.new()
local worldFolder: Folder
local shadowsFolder: Folder
local shadowStates = {} -- [BasePart] = state
local zoneKills = {} -- [zoneIndex] = поймано теней (всеми игроками) до Хранителя
local bosses = {} -- [zoneIndex] = BasePart

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

local function weld(part: BasePart, to: BasePart)
	local constraint = Instance.new("WeldConstraint")
	constraint.Part0 = to
	constraint.Part1 = part
	constraint.Parent = part
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
	if not Lighting:FindFirstChildOfClass("BloomEffect") then
		local bloom = Instance.new("BloomEffect")
		bloom.Intensity = 0.8
		bloom.Size = 30
		bloom.Threshold = 0.9
		bloom.Parent = Lighting
	end
end

-- Частицы атмосферы зоны: светлячки, туман, искры, снег, искры Бездны.
local function addAmbient(index: number, zone, parent: Instance)
	local emitterPart = makePart({
		Name = "Ambient",
		Size = Vector3.new(ZONE_SIZE, 1, ZONE_SIZE),
		Position = zoneCenter(index) + Vector3.new(0, if zone.ambient == "snow" then 45 else 2, 0),
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
		CanTouch = false,
		Parent = parent,
	})

	local emitter = Instance.new("ParticleEmitter")
	emitter.Color = ColorSequence.new(zone.ambientColor)
	emitter.LightEmission = 1
	emitter.LockedToPart = false

	if zone.ambient == "fireflies" then
		emitter.Rate = 12
		emitter.Lifetime = NumberRange.new(4, 7)
		emitter.Speed = NumberRange.new(0.5, 2)
		emitter.SpreadAngle = Vector2.new(180, 180)
		emitter.Acceleration = Vector3.new(0, 0.6, 0)
		emitter.Size = NumberSequence.new(0.35)
		emitter.Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 1),
			NumberSequenceKeypoint.new(0.3, 0),
			NumberSequenceKeypoint.new(0.6, 0.6),
			NumberSequenceKeypoint.new(1, 1),
		})
	elseif zone.ambient == "fog" then
		emitter.Rate = 6
		emitter.Lifetime = NumberRange.new(8, 12)
		emitter.Speed = NumberRange.new(0.5, 1.5)
		emitter.SpreadAngle = Vector2.new(180, 20)
		emitter.Size = NumberSequence.new(10, 18)
		emitter.LightEmission = 0.2
		emitter.Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 1),
			NumberSequenceKeypoint.new(0.4, 0.82),
			NumberSequenceKeypoint.new(1, 1),
		})
	elseif zone.ambient == "embers" then
		emitter.Rate = 25
		emitter.Lifetime = NumberRange.new(3, 6)
		emitter.Speed = NumberRange.new(3, 7)
		emitter.SpreadAngle = Vector2.new(25, 25)
		emitter.Acceleration = Vector3.new(0, 2, 0)
		emitter.Size = NumberSequence.new(0.25, 0)
		emitter.Transparency = NumberSequence.new(0, 1)
	elseif zone.ambient == "snow" then
		emitter.Rate = 60
		emitter.Lifetime = NumberRange.new(8, 10)
		emitter.Speed = NumberRange.new(3, 5)
		emitter.EmissionDirection = Enum.NormalId.Bottom
		emitter.SpreadAngle = Vector2.new(15, 15)
		emitter.Size = NumberSequence.new(0.3)
		emitter.LightEmission = 0.3
		emitter.Transparency = NumberSequence.new(0.1, 0.6)
	else -- void
		emitter.Rate = 30
		emitter.Lifetime = NumberRange.new(3, 5)
		emitter.Speed = NumberRange.new(2, 6)
		emitter.SpreadAngle = Vector2.new(180, 180)
		emitter.RotSpeed = NumberRange.new(-90, 90)
		emitter.Acceleration = Vector3.new(0, 1.5, 0)
		emitter.Size = NumberSequence.new(0.4, 0)
		emitter.Transparency = NumberSequence.new(0, 1)
	end
	emitter.Parent = emitterPart
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

	-- Декор: тёмные колонны со светящимися кристаллами
	for _ = 1, 8 do
		local height = rng:NextNumber(10, 26)
		local base = randomPointInZone(index, 0)
		makePart({
			Name = "Pillar",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(height, 3, 3),
			CFrame = CFrame.new(base + Vector3.new(0, height / 2, 0)) * CFrame.Angles(0, 0, math.rad(90)),
			Color = zone.shadowColor,
			Material = Enum.Material.Basalt,
			Parent = model,
		})
		local crystal = makePart({
			Name = "Crystal",
			Size = Vector3.new(1.4, 3, 1.4),
			CFrame = CFrame.new(base + Vector3.new(0, height + 1.8, 0)) * CFrame.Angles(0, rng:NextNumber(0, 6), math.rad(15)),
			Color = zone.glowColor,
			Material = Enum.Material.Neon,
			CanCollide = false,
			Parent = model,
		})
		local light = Instance.new("PointLight")
		light.Color = zone.glowColor
		light.Range = 18
		light.Brightness = 2
		light.Parent = crystal
	end

	addAmbient(index, zone, model)

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
	billboard.LightInfluence = 0
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
-- Модель тени (призрак: тело, хвост, глаза, свечение)
---------------------------------------------------------------------

local function buildGhost(kind: string, zone, size: number, cframe: CFrame): BasePart
	local isGold = kind == "gold"
	local isBoss = kind == "boss"
	local glow = if isGold
		then Color3.fromRGB(255, 210, 80)
		elseif isBoss then Color3.fromRGB(255, 50, 80)
		else zone.glowColor
	local bodyColor = if isGold
		then Color3.fromRGB(255, 200, 60)
		elseif isBoss then Color3.fromRGB(40, 8, 20)
		else zone.shadowColor

	local body = makePart({
		Name = if isBoss then "Guardian" elseif isGold then "GoldenShadow" else "Shadow",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(size, size, size),
		CFrame = cframe,
		Color = bodyColor,
		Material = if isGold then Enum.Material.Neon else Enum.Material.SmoothPlastic,
		CanCollide = false,
	})

	local tail = makePart({
		Name = "Tail",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(size * 0.75, size * 0.75, size * 0.75),
		CFrame = body.CFrame * CFrame.new(0, -size * 0.45, size * 0.1),
		Color = bodyColor,
		Material = body.Material,
		Transparency = 0.25,
		CanCollide = false,
		Anchored = false,
		Massless = true,
		Parent = body,
	})
	weld(tail, body)

	-- Глаза смотрят вперёд (-Z)
	local eyeColor = if isBoss then Color3.fromRGB(255, 40, 60) elseif isGold then Color3.fromRGB(90, 50, 0) else glow
	for _, side in { -1, 1 } do
		local eye = makePart({
			Name = "Eye",
			Shape = Enum.PartType.Ball,
			Size = Vector3.new(size * 0.18, size * 0.28, size * 0.12),
			CFrame = body.CFrame * CFrame.new(side * size * 0.2, size * 0.1, -size * 0.45),
			Color = eyeColor,
			Material = Enum.Material.Neon,
			CanCollide = false,
			CanQuery = false,
			Anchored = false,
			Massless = true,
			Parent = body,
		})
		weld(eye, body)
	end

	-- Рога Хранителя
	if isBoss then
		for _, side in { -1, 1 } do
			local horn = makePart({
				Name = "Horn",
				Size = Vector3.new(size * 0.12, size * 0.5, size * 0.12),
				CFrame = body.CFrame * CFrame.new(side * size * 0.28, size * 0.55, 0) * CFrame.Angles(0, 0, -side * math.rad(25)),
				Color = Color3.fromRGB(20, 5, 10),
				Material = Enum.Material.Slate,
				CanCollide = false,
				Anchored = false,
				Massless = true,
				Parent = body,
			})
			weld(horn, body)
		end
	end

	local light = Instance.new("PointLight")
	light.Color = glow
	light.Range = if isBoss then 30 else 12
	light.Brightness = if isBoss then 4 else 2
	light.Parent = body

	-- Призрачный шлейф
	local wisps = Instance.new("ParticleEmitter")
	wisps.Color = ColorSequence.new(glow)
	wisps.LightEmission = 1
	wisps.Rate = if isBoss then 30 else 8
	wisps.Lifetime = NumberRange.new(0.6, 1.2)
	wisps.Speed = NumberRange.new(0.5, 1.5)
	wisps.SpreadAngle = Vector2.new(180, 180)
	wisps.Size = NumberSequence.new(size * 0.25, 0)
	wisps.Transparency = NumberSequence.new(0.4, 1)
	wisps.Parent = body

	if isGold then
		local sparkles = Instance.new("Sparkles")
		sparkles.SparkleColor = Color3.fromRGB(255, 230, 120)
		sparkles.Parent = body
	end

	return body
end

local function buildHealthBar(part: BasePart, size: number, color: Color3)
	local billboard = Instance.new("BillboardGui")
	billboard.Name = "Health"
	billboard.Size = UDim2.fromOffset(90, 10)
	billboard.StudsOffset = Vector3.new(0, size / 2 + 1.5, 0)
	billboard.MaxDistance = 70
	billboard.LightInfluence = 0
	billboard.Enabled = false -- показываем после первого удара
	billboard.Parent = part

	local back = Instance.new("Frame")
	back.Size = UDim2.fromScale(1, 1)
	back.BackgroundColor3 = Color3.fromRGB(20, 15, 30)
	back.BorderSizePixel = 0
	back.Parent = billboard
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(1, 0)
	corner.Parent = back

	local fill = Instance.new("Frame")
	fill.Size = UDim2.fromScale(1, 1)
	fill.BackgroundColor3 = color
	fill.BorderSizePixel = 0
	fill.Parent = back
	corner:Clone().Parent = fill

	return billboard, fill
end

---------------------------------------------------------------------
-- Тени: появление, движение, урон, смерть
---------------------------------------------------------------------

local spawnShadow -- объявлено заранее, чтобы использовать внутри killShadow

local function wander(part: BasePart, state)
	while state.alive and part.Parent do
		local range = if state.kind == "boss" then 12 else 18
		local target = clampToZone(
			state.zone,
			part.Position + Vector3.new(rng:NextNumber(-range, range), 0, rng:NextNumber(-range, range))
		)
		local speed = if state.kind == "gold" then 14 elseif state.kind == "boss" then 4 else 6
		local duration = math.max(0.5, (target - part.Position).Magnitude / speed)
		local lookAt = CFrame.lookAt(part.Position, Vector3.new(target.X, part.Position.Y, target.Z))
		part.CFrame = lookAt
		TweenService:Create(part, TweenInfo.new(duration, Enum.EasingStyle.Sine), {
			CFrame = lookAt.Rotation + target,
		}):Play()
		task.wait(duration + (if state.kind == "gold" then 0.1 else rng:NextNumber(0.5, 2)))
	end
end

local function updateKillCounter(zoneIndex: number)
	shadowsFolder:SetAttribute("Kills" .. zoneIndex, zoneKills[zoneIndex] or 0)
end

local function killShadow(part: BasePart, state)
	state.alive = false
	shadowStates[part] = nil

	for _, child in part:GetDescendants() do
		if child:IsA("BasePart") then
			TweenService:Create(child, TweenInfo.new(0.3), { Transparency = 1 }):Play()
		end
	end
	local tween = TweenService:Create(part, TweenInfo.new(0.3), { Size = part.Size * 1.8, Transparency = 1 })
	tween:Play()
	tween.Completed:Once(function()
		part:Destroy()
	end)

	if state.kind == "boss" then
		bosses[state.zone] = nil
	else
		task.delay(Config.ShadowRespawnTime, spawnShadow, state.zone, "auto")
	end
end

local function spawnBoss(zoneIndex: number)
	if bosses[zoneIndex] then
		return
	end
	local part = spawnShadow(zoneIndex, "boss")
	bosses[zoneIndex] = part

	-- Сообщаем игрокам, которые сейчас в этой зоне
	for _, player in Players:GetPlayers() do
		GameService.Fx(player, "boss", zoneIndex)
	end

	task.delay(Config.Boss.duration, function()
		local state = shadowStates[part]
		if state and state.alive then
			state.alive = false
			shadowStates[part] = nil
			bosses[zoneIndex] = nil
			zoneKills[zoneIndex] = Config.Boss.retryKills
			updateKillCounter(zoneIndex)
			for player in state.contributors do
				if player.Parent then
					GameService.Notify(player, "Хранитель ушёл… Прокачайтесь и попробуйте снова", "bad")
				end
			end
			part:Destroy()
		end
	end)
end

-- Удар по тени. source: "tap" (клик), "auto" (Game Pass) или "spirit" (дух-помощник).
function WorldService.Hit(player: Player, part: BasePart, source: string)
	local state = shadowStates[part]
	if not state or not state.alive then
		return
	end
	local session = DataService.Get(player)
	if not session then
		return
	end

	local now = os.clock()
	if session.data.unlockedZone < state.zone then
		if source == "tap" and now - session.lastNotice > 2 then
			session.lastNotice = now
			GameService.Notify(player, "Эта зона закрыта — откройте её в меню «Зоны»", "bad")
		end
		return
	end

	local combo = 0
	if source == "tap" then
		if now - session.lastClick < Config.ClickCooldown then
			return
		end
		-- Проверка расстояния на сервере (защита от читов)
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		if not root or (root.Position - part.Position).Magnitude > Config.ClickRange + 10 then
			return
		end
		session.lastClick = now
		session.data.stats.taps += 1
		combo = GameService.RegisterCombo(session)
	end

	local damage, crit
	if source == "spirit" then
		damage, crit = Config.SpiritDamage(session.data), false
	else
		damage, crit = GameService.RollTapDamage(session)
	end
	if damage <= 0 then
		return
	end

	state.hp -= damage
	state.contributors[player] = true
	state.healthGui.Enabled = true
	state.fill.Size = UDim2.fromScale(math.clamp(state.hp / state.maxHp, 0, 1), 1)
	if state.kind == "boss" then
		part:SetAttribute("Hp", math.max(0, state.hp))
	end
	GameService.Fx(player, "damage", part.Position, damage, crit, combo, source)

	if state.hp > 0 then
		return
	end

	local position = part.Position
	killShadow(part, state)

	if state.kind == "boss" then
		-- Награда всем, кто бил Хранителя
		for contributor in state.contributors do
			if contributor.Parent then
				local amount, gems = GameService.RewardKill(contributor, state.zone, "boss", 0)
				GameService.Fx(contributor, "reward", position, amount, gems, false, "boss")
			end
		end
		zoneKills[state.zone] = 0
	else
		local amount, gems, lucky = GameService.RewardKill(player, state.zone, state.kind, combo)
		GameService.Fx(player, "reward", position, amount, gems, lucky, state.kind)
		zoneKills[state.zone] = math.min(Config.Boss.kills, (zoneKills[state.zone] or 0) + 1)
		if zoneKills[state.zone] >= Config.Boss.kills then
			spawnBoss(state.zone)
		end
	end
	updateKillCounter(state.zone)
end

-- kind: "normal", "gold", "boss" или "auto" (случайно: обычная или золотая)
function spawnShadow(zoneIndex: number, kind: string): BasePart
	if kind == "auto" then
		kind = if rng:NextNumber() < Config.Golden.spawnChance then "gold" else "normal"
	end
	local zone = Config.Zones[zoneIndex]
	local baseSize = 4 * (1 + (zoneIndex - 1) * 0.2)
	local size = if kind == "boss" then baseSize * 2.4 elseif kind == "gold" then baseSize * 0.85 else baseSize
	local hp = zone.shadowHp
		* (if kind == "boss" then Config.Boss.hpMultiplier elseif kind == "gold" then Config.Golden.hpMultiplier else 1)

	local position = if kind == "boss"
		then zoneCenter(zoneIndex) + Vector3.new(0, size / 2 + 2, 0)
		else randomPointInZone(zoneIndex, size / 2 + 1.5)
	local part = buildGhost(kind, zone, size, CFrame.new(position))

	local barColor = if kind == "boss" then Color3.fromRGB(255, 60, 80) elseif kind == "gold" then Color3.fromRGB(255, 210, 80) else zone.glowColor
	local healthGui, fill = buildHealthBar(part, size, barColor)
	if kind == "boss" then
		healthGui.Size = UDim2.fromOffset(200, 16)
		healthGui.MaxDistance = 200
		part:SetAttribute("IsBoss", true)
		part:SetAttribute("Zone", zoneIndex)
		part:SetAttribute("Hp", hp)
		part:SetAttribute("MaxHp", hp)
		part:SetAttribute("EndsAt", workspace:GetServerTimeNow() + Config.Boss.duration)
	end

	local click = Instance.new("ClickDetector")
	click.MaxActivationDistance = Config.ClickRange
	click.Parent = part

	local state = {
		zone = zoneIndex,
		kind = kind,
		hp = hp,
		maxHp = hp,
		alive = true,
		fill = fill,
		healthGui = healthGui,
		contributors = {}, -- [Player] = true
	}
	shadowStates[part] = state

	click.MouseClick:Connect(function(player)
		WorldService.Hit(player, part, "tap")
	end)

	part.Parent = shadowsFolder
	task.spawn(wander, part, state)
	return part
end

---------------------------------------------------------------------
-- Автоматические атаки: авто-ловля (Game Pass) и дух-помощник
---------------------------------------------------------------------

local function nearestShadow(position: Vector3, range: number, unlockedZone: number): BasePart?
	local nearest, nearestDistance = nil, range
	for part, state in shadowStates do
		if state.alive and state.zone <= unlockedZone then
			local distance = (part.Position - position).Magnitude
			-- Хранителя бьём в первую очередь
			if state.kind == "boss" then
				distance *= 0.3
			end
			if distance < nearestDistance then
				nearest, nearestDistance = part, distance
			end
		end
	end
	return nearest
end

local function autoCatchLoop()
	while true do
		task.wait(Config.AutoCatchInterval)
		for _, player in Players:GetPlayers() do
			local session = DataService.Get(player)
			local character = player.Character
			local root = character and character:FindFirstChild("HumanoidRootPart")
			if session and session.passes.AutoCatch and root then
				local target = nearestShadow(root.Position, Config.AutoCatchRange, session.data.unlockedZone)
				if target then
					WorldService.Hit(player, target, "auto")
				end
			end
		end
	end
end

local function spiritLoop()
	while true do
		task.wait(Config.SpiritInterval)
		for _, player in Players:GetPlayers() do
			local session = DataService.Get(player)
			local character = player.Character
			local root = character and character:FindFirstChild("HumanoidRootPart")
			if session and session.data.upgrades.spirit > 0 and root then
				local target = nearestShadow(root.Position, Config.SpiritRange, session.data.unlockedZone)
				if target then
					-- Сгусток летит от случайного питомца (или от игрока)
					local pets = PetService.GetPetParts(player)
					local from = if #pets > 0 then pets[math.random(1, #pets)].Position else root.Position + Vector3.new(0, 3, 0)
					GameService.Fx(player, "bolt", from, target)
					task.delay(0.25, WorldService.Hit, player, target, "spirit")
				end
			end
		end
	end
end

---------------------------------------------------------------------

function WorldService.Init()
	buildWorld()

	for zoneIndex = 1, #Config.Zones do
		zoneKills[zoneIndex] = 0
		updateKillCounter(zoneIndex)
		for _ = 1, Config.ShadowsPerZone do
			spawnShadow(zoneIndex, "auto")
		end
	end

	task.spawn(autoCatchLoop)
	task.spawn(spiritLoop)

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

-- Номер зоны по координате X (для интерфейса и проверок).
function WorldService.ZoneAt(position: Vector3): number
	local index = math.floor((position.X + ZONE_SIZE / 2) / (ZONE_SIZE + ZONE_GAP)) + 1
	return math.clamp(index, 1, #Config.Zones)
end

return WorldService
