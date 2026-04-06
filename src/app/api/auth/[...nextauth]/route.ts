import NextAuth from "next-auth";


const handler = NextAuth({
  providers: [
    // Add authentication providers here (e.g., Google, GitHub, etc.)   
    ],
    // You can also add custom pages, callbacks, and other NextAuth options here    
});

export { handler as GET, handler as POST };