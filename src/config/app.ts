type AppConfigType = {
    name: string,
    github: {
        title: string,
        url: string
    },
    author: {
        name: string,
        url: string
    },
}

export const appConfig: AppConfigType = {
    name: import.meta.env.VITE_APP_NAME ?? "SQL Gen",
    github: {
        title: "SQL Gen",
        url: "https://github.com/pisethx/sql-gen",
    },
    author: {
        name: "Piseth",
        url: "https://github.com/pisethx/",
    }
}

export const baseUrl = import.meta.env.VITE_BASE_URL ?? ""
