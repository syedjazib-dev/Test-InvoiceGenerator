
import { UserRole } from 'src/assets/static_data/UserRole'

export default interface IUser {
    id?: string
    name: string
    email: string,
    password? : string,
    role : UserRole,
    isActive? : boolean,
    createDate?: Date,
    updateDate?: Date
}