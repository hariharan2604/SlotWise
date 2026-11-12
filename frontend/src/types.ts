export type Resource = { id:number; name:string; description:string; location:string; capacity:number; isActive:boolean }
export type Booking = { id:number; resourceId:number; resourceName:string; purpose:string; startUtc:string; endUtc:string; status:string; bookedBy:string }
export type AuthResponse = { token:string; email:string; displayName:string; role:string }
