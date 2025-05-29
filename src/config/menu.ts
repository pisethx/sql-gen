import {
    CircleAlert,
    Files,
    Gauge,
    HomeIcon,
    LucideIcon
} from 'lucide-react'

type MenuItemType = {
    title: string
    url: string
    external?: string
    icon?: LucideIcon
    items?: MenuItemType[]
}
type MenuType = MenuItemType[]

export const mainMenu: MenuType = [
    {
        title: 'Home',
        url: '/',
        icon: HomeIcon
    }, 
]
