export default interface ICustomer {
    id?: number,
    name: string,
    address?: string,
    phone: string,
    email?: string,
    trn? : string,
    createDate?: Date,
    updateDate?: Date
}