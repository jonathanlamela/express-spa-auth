import * as yup from 'yup';


export const userCreateValidator = yup.object({
    email: yup.string().email().required(),
    name: yup.string().nullable(),
    fistname: yup.string().nullable(),
    password: yup.string().min(6).required()
});

export const changePasswordValidator = yup.object({
    oldPassword: yup.string().required(),
    newPassword: yup.string().min(6).required()
});

export const changeInfoValidator = yup.object({
    lastname: yup.string().nullable(),
    firstname: yup.string().nullable(),
});
