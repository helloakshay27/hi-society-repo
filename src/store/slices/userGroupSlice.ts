import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import createApiSlice from "../api/apiSlice";

export const fetchUserGroups = createAsyncThunk(
    "fetchUserGroups",
    async (
        {
            baseUrl,
            token,
            perPage,
            currentPage,
        }: { baseUrl: string; token: string; perPage?: number; currentPage?: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/pms/usergroups.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || "Failed to fetch user groups"
            );
        }
    }
);

export const createUserGroup = createAsyncThunk(
    "createUserGroup",
    async (
        { baseUrl, token, data }: { baseUrl: string; token: string; data: any },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(
                `https://${baseUrl}/pms/usergroups.json`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || "Failed to create user group"
            );
        }
    }
);

export const updateUserGroup = createAsyncThunk(
    "updateUserGroup",
    async (
        { baseUrl, token, data, id }: { baseUrl: string; token: string; data: any, id: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(
                `https://${baseUrl}/pms/usergroups/${id}.json`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || "Failed to update user group"
            );
        }
    }
);

export const fetchUserGroupId = createAsyncThunk(
    "fetchUserGroupId",
    async (
        { baseUrl, token, id }: { baseUrl: string; token: string; id: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/pms/usergroups/${id}.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || "Failed to fetch user group"
            );
        }
    }
);

export const fetchCrmUserGroups = createAsyncThunk(
    "fetchCrmUserGroups",
    async (
        { baseUrl, token }: { baseUrl: string; token: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/crm/usergroups.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.usergroups || [];
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || "Failed to fetch CRM user groups"
            );
        }
    }
);

export const fetchCrmUserGroupById = createAsyncThunk(
    "fetchCrmUserGroupById",
    async (
        { baseUrl, token, id }: { baseUrl: string; token: string; id: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/crm/usergroups/${id}.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || "Failed to fetch CRM user group"
            );
        }
    }
);

export const updateCrmUserGroup = createAsyncThunk(
    "updateCrmUserGroup",
    async (
        { baseUrl, token, data, id }: { baseUrl: string; token: string; data: any, id: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(
                `https://${baseUrl}/crm/usergroups/${id}.json`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || "Failed to update CRM user group"
            );
        }
    }
);

const fetchUserGroupsSlice = createApiSlice('fetchUserGroups', fetchUserGroups)
const createUserGroupSlice = createApiSlice('createUserGroup', createUserGroup)
const updateUserGroupSlice = createApiSlice('updateUserGroup', updateUserGroup)
const fetchUserGroupIdSlice = createApiSlice('fetchUserGroupId', fetchUserGroupId)
const fetchCrmUserGroupsSlice = createApiSlice('fetchCrmUserGroups', fetchCrmUserGroups)
const fetchCrmUserGroupByIdSlice = createApiSlice('fetchCrmUserGroupById', fetchCrmUserGroupById)
const updateCrmUserGroupSlice = createApiSlice('updateCrmUserGroup', updateCrmUserGroup)

export const fetchUserGroupsReducer = fetchUserGroupsSlice.reducer
export const createUserGroupReducer = createUserGroupSlice.reducer
export const updateUserGroupReducer = updateUserGroupSlice.reducer
export const fetchUserGroupIdReducer = fetchUserGroupIdSlice.reducer
export const fetchCrmUserGroupsReducer = fetchCrmUserGroupsSlice.reducer
export const fetchCrmUserGroupByIdReducer = fetchCrmUserGroupByIdSlice.reducer
export const updateCrmUserGroupReducer = updateCrmUserGroupSlice.reducer