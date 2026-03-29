import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function Home() {
  const store = await cookies()
  if (store.get("hm_auth")) {
    redirect("/chat")
  } else {
    redirect("/login")
  }
}
