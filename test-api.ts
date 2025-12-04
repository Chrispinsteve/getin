import { createHostProfile } from "@/app/api/host/profile/actions"

// This would be called from a React component after user authentication
async function testHostCreation() {
  const result = await createHostProfile({
    email: "chrispinsteve1@gmail.com",
    firstName: "Test",
    lastName: "Host",
    phone: "+1234567890",
  })
  
  console.log(result)
}