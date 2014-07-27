$(document).ready(function () {
    $(".js-only").removeClass("js-only");
    var spellgrid = $("#spellgrid").DataTable({
	language: {
            processing:     "Traitement en cours...",
            search:         "Rechercher&nbsp;:",
            lengthMenu:    "Afficher _MENU_ sorts",
            info:           "Affichage du sort _START_ &agrave; _END_ sur _TOTAL_",
            infoEmpty:      "Affichage du sort 0 &agrave; 0 sur 0",
            infoFiltered:   "(filtr&eacute; de _MAX_ sorts au total)",
            infoPostFix:    "",
            loadingRecords: "Chargement en cours...",
            zeroRecords:    "Aucun sort &agrave; afficher",
            emptyTable:     "Aucune donnée disponible dans le tableau",
            paginate: {
		first:      "Premier",
		previous:   "Pr&eacute;c&eacute;dent",
		next:       "Suivant",
		last:       "Dernier"
            },
            aria: {
		sortAscending:  ": activer pour trier la colonne par ordre croissant",
		sortDescending: ": activer pour trier la colonne par ordre décroissant"
            }
	},
	dom: 'lrptip', // R reorder
	orderCellsTop: true,
	colReorder: {
	    fixedColumns: 1,
	},
	order: [],
	lengthMenu: [ [ 25, 50, 100, -1 ], [ 25, 50, 100, "Tout" ] ],
    });
    var descriptors = {};
    var col = spellgrid.column(3);
    col.nodes().each(function (node) {
	node = $(node);
	var labels = node.text().split(', ');
	node.empty();
	labels.forEach(function (x) {
	    var descriptor = x.trim();
	    if (descriptor === '') return;
	    var label = $('<button class="label round">').text(descriptor);
	    if (!descriptors.hasOwnProperty(descriptor)) descriptors[descriptor] = [];
	    descriptors[descriptor].push(label);
	    label.on('click', function () {
		var label = $("#has-descriptor-" + descriptor);
		label.addClass("success").show();
		col.search(col.search()[0].split(' ').concat([descriptor]).join(' ')).draw();
		descriptors[descriptor].forEach(function (label) {
		    label.hide();
		});
	    });
	    node.append(label);
	});
    });
    $("#descriptors-filter").empty();
    for (descriptor in descriptors) {
	var label = $('<a class="label round" id="has-descriptor-' + descriptor + '">').text(descriptor).hide();
	label.click(function () {
	    var descriptor = $(this).text().trim();
	    $(this).removeClass("success").hide();
	    col.search(col.search()[0].split(' ').filter(function (x) { return x !== descriptor; }).join(' ')).draw();
	    descriptors[descriptor].forEach(function (label) {
		label.show();
	    });
	});
	$("#descriptors-filter").append(label);
    }
    $("#show-level input.show-column").change(function (e) {
	if ($("#show-level input.show-column:checked").length == 0) {
	    $(this).prop("checked", true);
	}
    });
    $("#show-level").submit(function (e) {
	e.preventDefault();
	var some_checked = false;
	if ($(this).find("input.show-column:checked").length == 0) {
	    $(this).find("input.show-column:first").prop("checked", true);
	}
	$(this).find("input.show-column").each(function (i, obj) {
	    some_checked = some_checked || $(obj).is(":checked");
	    spellgrid.columns($(obj).prop("name")).visible($(obj).is(":checked"));
	});
	if ($("#level-drop").data("target"))
	    $("#level-drop").data("target").click();
    });
    $("#show-level").submit();
});
