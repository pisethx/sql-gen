import { appConfig } from "@/config/app"
import { DatabaseIcon } from "lucide-react"

export function AppLogo() {
    return (
        <div className='flex items-center gap-2'>
            <DatabaseIcon className='size-6 fill-gray-900 dark:fill-gray-50' />
            <span className="font-semibold text-nowrap">{appConfig.name}</span>
        </div>
    )
}