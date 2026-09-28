import { createContext, useContext } from 'react'

/** Переход в чужой профиль из любого места приложения. */
export const ProfileNav = createContext<(personId: string) => void>(() => {})
export const useOpenProfile = () => useContext(ProfileNav)
