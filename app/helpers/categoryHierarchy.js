const buildCategoryTree = (categories = []) => {
	const byParent = new Map();

	categories.forEach((category) => {
		const parentId = category.id_parent_category || null;
		if (!byParent.has(parentId)) {
			byParent.set(parentId, []);
		}
		byParent.get(parentId).push(category);
	});

	const attachChildren = (category, visited = new Set()) => {
		if (visited.has(category.id_category)) {
			return { ...category, categories: [] };
		}

		const nextVisited = new Set(visited);
		nextVisited.add(category.id_category);
		return {
			...category,
			categories: (byParent.get(category.id_category) || [])
				.map((child) => attachChildren(child, nextVisited)),
		};
	};

	return (byParent.get(null) || []).map((category) => attachChildren(category));
};

module.exports = {
	buildCategoryTree,
};
