import React, { useEffect, useState } from "react";
import SearchList from "../SearchList";
import { useStore } from "../../store/useStore";
import apiFetch from "@wordpress/api-fetch";
import { data } from "../../store/useDataStore";
import snakeCase from "lodash/snakeCase";
import toast from "react-hot-toast";
import { addQueryArgs } from "@wordpress/url";

const Users = () => {
  const [fields, setStore] = useStore((store) => store);
  const { searchText, selectedCategory, backspace } = fields;
  const [firstFetchRoles, setFirstFetchRoles] = useState({});
  const [firstFetchUsersByRole, setFirstFetchUsersByRole] = useState({});

  function getAllUserRole() {
    setStore({
      isLoading: true,
    });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: "get-user-roles" }).then((roles) => {
      if (selectedCategory?.[0] !== "Users" && selectedCategory?.length !== 1) return;

      endTime = new Date().getTime();

      const userRoles = [];
      Object.values(roles).forEach((item) => {
        userRoles.push({
          id: snakeCase(item),
          title: item,
          role: item,
          url: "",
          dependency: true,
          direction: "cornerRightUp",
        });
      });

      setStore({
        defaultData: userRoles,
        result: [],
        resTime: endTime - startTime,
        resultCount: userRoles.length,
        isLoading: false,
        // resTime: 0,
        // resultCount: 0,
      });

      setFirstFetchRoles({
        userRoles: userRoles,
        resTime: endTime - startTime,
        resultCount: userRoles.length,
      });
    });
  }

  function getUsersByRole(role) {
    setStore({
      isLoading: true,
    });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({ path: `get-users-by-role?role=${role}` }).then((userData) => {
      if (selectedCategory?.[0]?.id !== "users" && selectedCategory?.length !== 2) return;

      endTime = new Date().getTime();

      const users = [];
      userData.forEach((user) => {
        users.push({
          id: user.id,
          title: `${user.name} (${user.email})`,
          url: user.edit_url,
          viewUrl: user.view_url,
          currentUser: user.current_user,
          icon: "users",
          direction: "link",
          dependency: true,
          callback: true,
        });
      });

      setStore({
        isLoading: false,
        defaultData: users,
        result: [],
        resTime: endTime - startTime,
        resultCount: users.length,
        callback: userActions,
      });

      setFirstFetchUsersByRole({
        users: users,
        resTime: endTime - startTime,
        resultCount: users.length,
      });
    });
  }

  function getUsersByEmailAndRole(email, role) {
    setStore({
      isLoading: true,
    });
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({
      path: `get-users-by-email?email=${email}&role=${role}`,
    }).then((userData) => {
      if (selectedCategory?.[0]?.id !== "users" && selectedCategory?.length !== 2 && !searchText)
        return;

      endTime = new Date().getTime();

      const users = [];
      userData.forEach((user) => {
        users.push({
          id: user.id,
          title: `${user.name} (${user.email})`,
          url: user.edit_url,
          currentUser: user.current_user,
          icon: "users",
          direction: "link",
          dependency: true,
          callback: true,
        });
      });

      setStore({
        isLoading: false,
        defaultData: users,
        result: [],
        resTime: endTime - startTime,
        resultCount: users.length,
        callback: userActions,
      });
    });
  }

  function userActions(res) {
    setStore({
      defaultData: [
        {
          id: "usr_edit",
          title: "Edit",
          url: res.url,
          direction: "link",
        },
        {
          id: "usr_view",
          action: "usr_view",
          title: "View",
          url: res.viewUrl,
          direction: "link",
          newWindow: true,
        },
        {
          id: "usr_delete",
          action: "usr_delete",
          title: "Delete",
          userId: res.id,
          callback: true,
          disabled: res.currentUser,
          disabledMessage: "You can't delete your self.",
          isPremium: !WPSPOTLIGHT_CORE.is_premium,
        },
        // {
        //   id: "usr_switch",
        //   title: `Switch`,
        //   // url: `https://downloads.wordpress.org/plugin/${res?.slug}.zip`,
        //   // newWindow: true,
        //   // slug: "",
        //   // icon: "download",
        //   // direction: "link",
        //   isPremium: !WPSPOTLIGHT_CORE.is_premium,
        // },
        {
          id: "usr_reset_pass",
          action: "usr_reset_pass",
          title: `Send Reset Password`,
          userId: res.id,
          callback: true,
        },
      ],
      result: [],
      resTime: 0,
      resultCount: 0,
      callback: userAction,
    });
  }

  function userAction(res) {
    if (res.action === "usr_delete") {
      deleteUser(res.userId);
    } else if (res.action === "usr_reset_pass") {
      resetPassword(res.userId);
    }
  }

  const deleteUser = (userId) => {
    const isDelete = window.confirm("Are you sure delete this user?");
    if (!isDelete) return;
    const queryParams = { user_id: userId };

    const path = addQueryArgs("delete-user", queryParams);

    apiFetch({ path, method: "DELETE" }).then((response) => {
      if (response.status === "success") {
        toast.success(response?.message);
      } else {
        toast.error(response?.message);
      }
    });
  };

  const resetPassword = (userId) => {
    const queryParams = { user_id: userId };

    const path = addQueryArgs("send-reset-password", queryParams);

    apiFetch({ path }).then((response) => {
      if (response.status === "success") {
        toast.success(response?.message);
      } else {
        toast.error(response?.message);
      }
    });
  };

  function getUsersByEmail(email) {
    let startTime = new Date().getTime(),
      endTime;
    apiFetch({
      path: `get-users-by-email?email=${email}`,
    }).then((userData) => {
      if (selectedCategory?.[0]?.id !== "users" && selectedCategory?.length !== 1 && !searchText)
        return;

      endTime = new Date().getTime();

      const users = [];
      userData.forEach((user) => {
        users.push({
          id: user.id,
          title: `${user.roles?.[0]} > ${user.name} (${user.email})`,
          url: user.edit_url,
          viewUrl: user.view_url,
          currentUser: user.current_user,
          icon: "users",
          // direction: "link",
          dependency: true,
          callback: true,
        });
      });

      setStore({
        defaultData: users,
        result: [],
        resTime: endTime - startTime,
        resultCount: users.length,
        callback: userActions,
      });
    });
  }

  useEffect(() => {
    if (selectedCategory?.length > 0 && backspace) {
      selectedCategory.pop();
      setStore({
        selectedCategory: selectedCategory,
        backspace: false,
        resTime: 0,
        resultCount: 0,
      });
    }

    if (selectedCategory?.[0]?.id === "users" && selectedCategory?.length === 1 && !searchText) {
      setStore({ delaySearch: false });
      getAllUserRole();
    } else if (
      selectedCategory?.[0]?.id === "users" &&
      selectedCategory?.length === 2 &&
      !selectedCategory?.[1]?.title?.includes("@") &&
      !searchText
    ) {
      setStore({ delaySearch: false });
      getUsersByRole(selectedCategory?.[1]?.role);
    } else if (selectedCategory?.length === 0) {
      setStore({ defaultData: data, delaySearch: false });
    }
  }, [selectedCategory, backspace]);

  useEffect(() => {
    if (
      selectedCategory?.[0]?.id === "users" &&
      selectedCategory?.length === 2 &&
      !selectedCategory?.[1]?.title?.includes("@") &&
      searchText
    ) {
      setStore({ delaySearch: true });
      getUsersByEmailAndRole(searchText, selectedCategory[1]?.title);
    } else if (
      selectedCategory?.[0]?.id === "users" &&
      selectedCategory?.length === 1 &&
      searchText
    ) {
      setStore({ delaySearch: true });
      getUsersByEmail(searchText);
    } else if (
      selectedCategory?.[0]?.id === "users" &&
      selectedCategory?.length === 1 &&
      !searchText
    ) {
      if (firstFetchRoles?.userRoles?.length) {
        setStore({
          defaultData: firstFetchRoles?.userRoles || [],
          result: [],
          resTime: firstFetchRoles?.resTime || 0,
          resultCount: firstFetchRoles?.resultCount || 0,
        });
      }
      // else {
      //     getAllUserRole();
      // }
    } else if (
      selectedCategory?.[0]?.id === "users" &&
      selectedCategory?.length === 2 &&
      !selectedCategory?.[1]?.title?.includes("@") &&
      !searchText
    ) {
      setStore({
        defaultData: firstFetchUsersByRole?.users,
        result: [],
        resTime: firstFetchUsersByRole?.resTime || 0,
        resultCount: firstFetchUsersByRole?.resultCount || 0,
      });
    }
  }, [searchText]);

  return <SearchList />;
};

export default Users;
