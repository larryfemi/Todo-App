import { Template } from "meteor/templating"
import { TasksCollection } from "../api/TaskCollections"
import { ReactiveDict } from "meteor/reactive-dict"
import "./app.html"
import "./task"
import "./login"

Template.mainContainer.onCreated(function mainContainerOnCreated() {
	this.state = new ReactiveDict()
})

const HIDE_COMPLETED_STRING = "hideCompleted"

Template.mainContainer.events({
	"click #hide-completed-button"(event, instance) {
		const currentHideCompleted = instance.state.get(HIDE_COMPLETED_STRING)
		instance.state.set(HIDE_COMPLETED_STRING, !currentHideCompleted)
	},
	"click .user"() {
		Meteor.logout()
	},
})

const getUser = () => Meteor.user()
const isUserLogged = () => !!getUser()
const getTasksFilter = () => {
	const user = getUser()

	const hideCompletedFilter = { isChecked: { $ne: true } }

	const userFilter = user ? { userId: user._id } : {}

	const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter }

	return { userFilter, pendingOnlyFilter }
}

Template.mainContainer.helpers({
	tasks() {
		const instance = Template.instance()
		const hideCompleted = instance.state.get(HIDE_COMPLETED_STRING)

		const { pendingOnlyFilter, userFilter } = getTasksFilter()

		if (!isUserLogged()) {
			return []
		}

		return TasksCollection.find(
			hideCompleted ? pendingOnlyFilter : userFilter,
			{
				sort: { createdAt: -1 },
			}
		).fetch()
	},
	incompleteCount() {
		if (!isUserLogged()) {
			return ""
		}

		const { pendingOnlyFilter } = getTasksFilter()

		const incompleteTasksCount = TasksCollection.find(pendingOnlyFilter).count()
		return incompleteTasksCount ? `(${incompleteTasksCount})` : ""
	},
	getUser() {
		return getUser()
	},
	isUserLogged() {
		return isUserLogged()
	},
})

Template.form.events({
	"submit .task-form"(event) {
		// Prevent default browser form submit
		event.preventDefault()

		// Get value from form element
		const target = event.target
		const text = target.text.value

		// Insert a task into the collection
		TasksCollection.insert({
			text,
			userId: getUser()._id,
			createdAt: new Date(), // current time
		})

		// Clear form
		target.text.value = ""
	},
})
