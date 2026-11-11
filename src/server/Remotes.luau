-- Создаёт RemoteEvent'ы для связи сервера и клиента.
-- Модуль кэшируется, поэтому объекты создаются один раз.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local folder = Instance.new("Folder")
folder.Name = "Remotes"

local function make(name: string): RemoteEvent
	local remote = Instance.new("RemoteEvent")
	remote.Name = name
	remote.Parent = folder
	return remote
end

local Remotes = {
	DataChanged = make("DataChanged"), -- сервер → клиент: снимок данных игрока
	Notify = make("Notify"), -- сервер → клиент: всплывающее сообщение
	Action = make("Action"), -- клиент → сервер: действие игрока (купить, переродиться...)
	Fx = make("Fx"), -- сервер → клиент: эффекты (урон, награда, вылупление, Хранитель...)
}

folder.Parent = ReplicatedStorage

return Remotes
